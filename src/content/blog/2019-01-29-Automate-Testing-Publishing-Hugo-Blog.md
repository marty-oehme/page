---
title: "Automated Testing and Publishing This Hugo Blog"
description: "Setting up an automatic deployment to Netlify, GitLab Pages, or your own server"
pubDate: 2019-01-29T13:20:01+01:00
weight: 10
tags:
  - hosting
  - blog
---

## Table of Contents

## The Concepts

I built this blog with [hugo](https://gohugo.io), a static site generator. Before
you go further, you should at least know what that means – it precompiles pages
through a cli, which any static server can then display – but you can
follow these links to get a more detailed overview of the concepts behind the
it:

- [An introduction to static site generators](https://www.oreilly.com/web-platform/free/files/static-site-generators.pdf)
  – what they are, why they are useful
- [What hugo itself is about](https://gohugo.io/about/what-is-hugo/) – why a lot
  of people switched from Jekyll, and a [feature overview](https://gohugo.io/about/features/)
- [Alternatives to hugo](https://www.staticgen.com) – static site
  generators introduced &
  [compared](https://www.netlify.com/blog/2018/08/24/the-top-10-ssgs-of-2018-according-to-staticgen-and-github/)

The purpose of this article is not to expound on the virtues of static site
generators, but to show how we can integrate them with a version control system
– git – and an automatic build pipeline – gitlab runners – to reduce the
amount of manual work that we have to do between writing an article and
seeing it published on the page. (Though writing is, alas, still not automated.)

Lastly, we also want to be flexible in _what_ gets compiled, depending on the
sort of content we just wrote, and _where_ our compiled site ends up. In other
words, whenever I write a draft of a new article I want hugo to compile it and
my deployment script to send it to a specific destination server. This is so I
can use it to preview my ramblings for myself before sending them out into the
world. When the post satisfies my expectations, I want to send them to the main
blog – the master branch – and have it automatically end up, compiled and
pretty, at my actual blog server. I will focus on two ways to achieve this:
Using netlify to automate it all, and using gitlab-ci to send it to gitlab
pages, and my own server. Personally, I use the latter method. But I will begin
by highlighting the netlify route, since it's the easiest. (If you are already
thinking, where’s the fun in that – jump down below to Method #2!)

## The Prerequisites – Version Control

If the following sounds, above all else, like gobbledygook to you, have a quick
read through the [git-scm book](https://git-scm.com/book/en/v2) and familiarize
yourself with the git basics: staging, commits, branches. When that is clear
look at concepts like ssh, and branching work-flows (and if you are adventurous
re-basing), and see how [GitLab](https://gitlab.com/help/user/index.md) apply
them. A basic familiarity with versioning software is indispensable when
thinking about automatic integrations and deployments, as we will do in the
following paragraphs.

Both methods of automation assume you keep your hugo static site source files in
a git repository, and keep that repository on some variation of a hosted git
repo – I use GitLab.com, though the process should work just as well with
Github.com. If you are on a self-hosted version of GitLab you will
need to set up your own GitLab-runners to enjoy automated building. I don't use
my own instance, so I can not give credible advice there.

The easiest way to get set up and running on GitLab (or on another host, with
slightly different steps) is to use the brilliant
[hugo GitLab Pages](https://gitlab.com/pages/hugo) project. Just follow the
steps laid out in the ReadMe – which boil down to fork the repo, rename it to
what GitLab Pages requires, and sever the forking relationship – to have a
working copy of hugo in minutes.

A couple of words on the repository. The current iteration of my blog – the one
that is on-line and you are reading right now – resides on the `master` branch
of my repository, as in most repositories. I have two other long-running
branches: `develop`, which is the one I push to when I consider a post pretty
much ready and I want to make a final review of it; and `drafts`, which I should
potentially call `ideas` instead, which is where I keep unfinished posts and
generally things which are not fleshed out enough yet, but I want to remember to
write about in the future. There are other ways to do this – you may keep a
separate directory containing your post ideas and outlines, or do it in the
project documentation of the GitLab project (as in, the GitLab Wiki, or ReadMe
files). The advantage I see for keeping it in one branch is that they don’t
interfere with my more fleshed out posts yet they are still directly connected
to surrounding posts and always within reach – just a git pull away. On the
other hand, periodic housekeeping is necessary. Namely, the occasional re-basing
to keep up with published posts and sometimes the manual deletion of left-over
drafts.

When a draft has collected enough substance to for me to work on as a full
article, I will branch off from the drafts branch into a new branch named after
the post. That means this post would receive some variation of `post-automate-hugo-publishing`.[^gitflow]
Since I am the sole writer on this blog and generally don’t write ten articles
at once this is enough for me to distinguish what I am working on and keep it
organized. If you need more organization, or have more than one person working
on your content at once, you may want to think about GitLab’s recommendation of
[revolving all changes around issues](https://about.gitlab.com/2016/03/03/start-with-an-issue/),
and their more general
[work-flow recommendations](https://about.gitlab.com/2016/10/25/gitlab-workflow-an-overview/#gitlab-workflow).
Since you are here, I will assume such regimented organization is excessive for
you, as it would be for me. [^fun]

The git concepts to keep in mind are: `master` branch for production version of
the blog, `develop` branch for your personal preview, `drafts` for your new
ideas, and individual branches for individual posts.

## Deploying to Netlify

Before we look at the specifics of deploying our hugo repository to Netlify, let
me point out the wonderful
[documentation](https://www.netlify.com/docs/continuous-deployment/) provided by
them. They have a video tutorial series and in-depth documentation of what you
do, how you do it, and often (best of all) _why_ you do it.

Most of the necessary configuration gets taken care of by Netlify magic behind
the scenes. All you have to do to get started is Sign up for Netlify and
click ‘Create New site from Git’. It will present you with a choice of hosted
git providers.[^netlify-selfhosted] Authenticate with whatever provider hosts
your git repo and select it on the following screen.

![Netlify provider choice](/2019-01-29/netlify-providers.png)

When you have selected the correct repository, Netlify should _automatically_
detect that you want to create a hugo site and fill out the build command and
publish directory. It will also create an environment variable called
`HUGO_VERSION`, though in my case it did not correspond with my own hugo
version. If you are unsure which hugo version you are running, you generally
just want to leave it at the default. Fill out any missing fields and hit the
‘Deploy’ button.

![Netlify Deploy settings](/2019-01-29/netlify-deploy.png)

The thing will work for a little and when it’s done, you have a published blog
under a netlify domain. In the site settings you can select a specific domain
where you want to reach it at (even custom domains, but they will cost you), as
well as further deploy contexts.

Remember that we wanted to have a preview version for ourselves, next to
the production-ready blog? Under `Site Settings > Deploy contexts` you can
create ‘Branch deploys’. Netlify will publishe these (under
separate sub-domains) whenever you push to the respective branch.

As of now, we are just building whenever something gets pushed to the `master`
branch. To have our preview branch automatically build as well select the
option to add individual branches, and input `develop`.

![Netlify Branch Deploys](/2019-01-29/netlify-branches.png)

That’s it, we have a fully working blog living at `somepagename.netlify.com`, as
well as our personal preview at `develop--somepagename.netlify.com` . If you
explore Netlify some more you will see that it can automatically add comments to
new commits on your selected branches with the link to the new page deployment,
create a password protection for the preview version of your blog and do some
post-processing on your content to get it to display faster on people’s
browsers. Those features are beyond the scope of this quick
introduction and rather left as an exercise for you.

## Deploying to GitLab Pages

Netlify hides much of the complexity of the process and thus becomes a painless
target to deploy to. That opaqueness simultaneously obscures some of its
inherent drawbacks: What if you want to preview pages marked as `draft`s under
hugo? What if you don’t want your preview to share a similar address as your
main page (preferably without needing to use a paid account on Netlify)? What if
you have your blog running on your own server? While I will answer the latter
question in the following section, the answer to the first two can come in the
form of deployments to GitLab Pages.

From the perspective of a static site, GitLab Pages is the same as Netlify – a
back-end server which compiles your hugo files, and a static server which holds
and serves those compiled files. But it comes with more customization, and thus
some more complexity. Before heading down this road you should at least be
familiar with some of the simple linux shell commands – moving files with `mv`,
uncompressing with `tar`, downloading with `wget`.

GitLab Pages uses a file at the root of your repo called `.gitlab-ci.yml` to
know that it should compile the files with hugo and save them on its Pages
server.[^compare-netlify] This is a file written in
[YAML](https://en.wikipedia.org/wiki/YAML), which consists of key:variable
pairs. (It’s analogous to JSON.)

There are a couple of rules for these files specifically: As soon as the file
exists, GitLab tries to create a build pipeline for every commit (…which follows
the build rules we will lay out in the file itself). You can specify which
branches the build process should run for. The pipeline separates builds into
stages, which it followes sequentially. Stages contain specific Jobs, which
describe what it should do on the machine.[^stages-jobs] Between jobs the
system generally empties itself, deletes all files and starts fresh.[^docker]
But there are certain paths that you can mark as important and which the system
will then keep – useful for our compiled files.

## The Basics

If you want to first get an overview of the complete package of our deployment
instructions, you can do so below. For now we will build it up piece by piece,
starting with GitLab deployment to its Pages, as defined in `.gitlab-ci.yml`:
[^predefined]

```yaml
pages:
  script:
    - echo "Deploying to pages"
    - hugo
  artifacts:
    paths:
      - public
  only:
    - master
```

We do a couple of things in this small snippet:

- We define a job with the name `pages.` You can name your jobs whatever you
  like (with some restrictions – you can’t name it script for instance).
- We define a script to execute as part of our job. The script is the
  sole _required_ part of a job, the rest is optional. This is where we say what
  should happen, it consists of a list of shell commands that get executed. In
  our case, it first prints “Deploying to pages” to the screen. This is not
  necessary, I mainly included it to show you how you run more than one command
  after another. Then it runs hugo which takes care of the compilation of our
  static files for us.
- We specify a directory (`/public`) which is important and should not be
  deleted after this job has finished. Indeed, at this path lies the finished
  output, which is what GitLab calls `artifacts`. When we call hugo without
  any arguments it automatically builds into a directory called `public`, and
  GitLab Pages expects its files in a directory called `public`, so this works
  well for us.
- We say: The exclusive time this job should run is when a new commit to the
  `master` branch happens.

## Supplying the Magic

This mirrors what we told Netlify to do earlier. But if you were to
commit this as the sole content of the file, you would receive an error.
Some of the magic that Netlify did we will now supply ourselves:

```yaml
image: alpine

pages:
  before_script:
    - wget -O 0.52.tar.gz https://github.com/spf13/hugo/releases/download/v0.52/hugo_0.52_Linux-64bit.tar.gz
    - tar xf 0.52.tar.gz && mv hugo* /usr/bin/hugo
    - hugo version
  script:
    - hugo
  artifacts:
    paths:
      - public
  only:
    - master
```

If we had run the script before, it would have complained that it does not know
what we mean by that, and for a simple reason: We have not supplied hugo to our
machine yet. This is what we are doing now:

- We are supplying alpine Linux as the underlying system this job should be
  running on.[^per-job-image] Alpine linux is often used for deployment jobs
  like this, since the image is incredibly small and comes without a lot of the
  baggage that you would need in a full Linux installation, but which is
  unnecessary for our purposes.
- We define three commands which should run before our script commands
  (hence, `before_script`). This works just as if we had called it as commands
  within the `script:` key, we just signal that they are separate from the script.
  Such a separation of set-up steps, actual script, and possible tear-down steps
  (with `after_script`) will often be useful later on.
- First, we download a specific hugo release from their github page. This
  release comes as a compressed .tar.gz file, and we rename it to just its
  version number: `0.52.tar.gz` . Pinning the version to a specific one as we do
  here can often be useful to avoid conflicts whenever the hugo application
  updates and may change some of its functions. Otherwise you would have to
  restructure your blog each time this happens.
- Then, we extract the downloaded file (`tar`). The file contains a single hugo
  binary which we then move to the `/usr/bin` directory. When an executable is
  in this directory it will generally be available from anywhere by calling the
  name of the executable – in other words, we have enabled our `script:` to make
  use of `- hugo` , regardless where we call it from .
- As a last step we print the current hugo version to the screen. Just as our
  `echo “Deploying to Pages”` earlier (which we got rid of), this is not
  necessary. Yet it can prove useful later on should something go wrong and
  you always have the version of hugo it happened under within reach.

If you commit this file to your repository, GitLab will pick it up and, if your
repository carries the correct name (see the hugo pages project ReadMe), deploy
it to Pages as a functional site. But to make our life easier down the road, and
to build in some simple security measures, we will still extend it slightly
more.

## Improving the Basics

Whenever you download something from the web, there is a chance that what you
receive is not the full package you wanted. Dropped packets, bad connections,
outages, intercepted requests – more than enough reasons for you to check what
you got is what you want. Also, whenever you want to switch to a newer version
of hugo, with the script above you have to change the version number throughout
your scripts. More room for errors and bad practice. Lastly, and this is for
more advanced cases such as including a new plugin or hugo theme, this build
script is not prepared to accommodate other git repositories. Let’s
review how we can fix these issues:

```yaml
image: alpine

variables:
  HUGO_VERSION: "0.52"
  HUGO_SHA: "b4d1fe91023e3fe7e92953af12e08344d66ab10a46feb9cbcffbab2b0c14ba44"
  GIT_SUBMODULE_STRATEGY: recursive

before_script:
  - apk update && apk add openssl ca-certificates
  - wget -O ${HUGO_VERSION}.tar.gz https://github.com/spf13/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz
  - echo "${HUGO_SHA}  ${HUGO_VERSION}.tar.gz" | sha256sum -c
  - tar xf ${HUGO_VERSION}.tar.gz && mv hugo* /usr/bin/hugo
  - hugo version

test:
  script:
    - hugo
  except:
    - master

pages:
  script:
    - hugo
  artifacts:
    paths:
      - public
  only:
    - master
```

Let’s go through the changes to our Pages script one last time:

- We create some variables at the top. These are variables that you can then use
  throughout the script according to your needs.
- Variable `HUGO_VERSION` let’s us target a specific version of hugo without
  needing to change it all over our script. Every use of the version has been
  replaced with `${HUGO_VERSION}` which is automatically replaced with the
  content of the variable when building. Whenever we want to use a different
  hugo version all we have to do is change this variable (and `HUGO_SHA`, we’ll
  get to that in a minute).
- Variable `GIT_SUBMODULE_STRATEGY` tells GitLab that, if there are any
  submodules (-- other repositories added to this one) in
  the repo, it fetches those as well before starting any build steps. (And if
  those include any submodules also retrieve them – hence, recursive.)
  [^recursive-submodules]
- Variable `HUGO_SHA` specifies a
  [hash](https://en.wikipedia.org/wiki/Secure_Hash_Algorithms) which describes
  the contents of the file we will download in a second. If you don’t know what
  a hash is, don’t worry – just think of it as a way to check if the
  contents of something are identical to what you expect or if bits are missing or
  wrong. You can get this obtuse string from the same
  [releases page](https://github.com/gohugoio/hugo/releases) where you download
  hugo itself, as part of a file called `hugo_checksums.txt`. Find the
  correct checksum for your distribution and copy it into the variable.
- The `before_script` part gets some more commands to do with the hash above. We
  install some packages which allow us to verify the downloaded file and check
  it for corruption or verify its integrity. When the file fully meets our
  expectations we can move on to extracting it.
- Another addition is a whole second job! The test job runs the `hugo` script
  for commits on any branch _except_ for our master branch. It does not keep the
  generated files and instead, when hugo has compiled without errors, just ends
  without doing anything with them. What is that useful for? It lets you see
  when you have made a catastrophic mistake with any one of your commits, and
  hugo would not even build anymore. That is why I called the job `test:`.
  This is also where we see us splitting the commands into `before_script` and
  `script` come in handy. We took the `before_script` part out of its
  specific job, and now it runs before _both_ jobs to prepare the hugo
  build environment. Good categorization like this helps you write much simpler
  build scripts (compare this with duplicating our before script for each
  individual job – increasingly so when we add more).

Now we have a secure and pretty flexible build script. We can add hugo themes as
submodules, we can change the hugo version without much effort, our download gets
checked for accuracy before doing anything with it and we even have an
(admittedly basic) way of testing our changes. Congratulations! You made it far.
Now, it may appear like so much more configuration than what we had to do with
Netlify – and yes, I would agree. But all that configuration has advantages. We
are the masters of the situation now, in other words. There is so much more
customization we can use now. We can create new build targets (as we will do in
the next section). We can create our own security measures and use specific
versions of hugo. We can develop our own tests (hey, maybe all your posts should
follow a certain formatting? Maybe we want to ensure that Post titles and URL
slugs are always the same, or contain the same date? You get the picture.) And
such customization will be necessary for the next part of our journey:
deploying to our own server.

## Deploying to our own server

We have now looked at how to deploy both to Netlify and GitLab Pages. Let us
take the last step and deploy to our own server. To be able to do this, we will
make use of rsync, which means we will need to handle ssh keys and file
transferral between servers. Again, the complexity of the task rises a bit –
but it should not be anything we can’t handle with what we learned and some
knowledge of the Linux system.

If you are new to running a server for yourself, I strongly recommend you read
through some of the initial set up guides provided by the DigitalOcean
community:

- [Initial Server Setup with Ubuntu 16.04](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-16-04)
  – the initial server creation, setting up a root login and basic security
  measures
- [How to Set Up SSH Keys on Ubuntu 16.04](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-1604)
  – goes through the creation and set up process for SSH keys in more depth
- [New Ubuntu 14.04 Server Checklist](https://www.digitalocean.com/community/tutorial_series/new-ubuntu-14-04-server-checklist)
  – written for a slightly older Ubuntu version, but the ideas hold and the
  advice is sound
- [How To Protect SSH with Fail2Ban on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-14-04)
  – slightly advanced security measures – not strictly necessary right now,
  but good to keep in mind for later
- [How to Secure Nginx with Let’s Encrypt on Ubuntu 16.04](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)
  – setting up HTTPS encryption with the correct certificates; again, not
  strictly necessary at the beginning, but increasingly necessary when heading toward
  production-readiness

## The build step

The deployment follows the same basic steps as the others – we build the files
with hugo and then send them off to where the server will find them. We will
continue doing this in two separate pipeline jobs, as we did with Pages. This is
good practice primarily to assign each job just that – one job. But it also
helps later on: if we decide to execute tests, or to send our files to more
servers, or we need more build steps, or any other need to change or progress
the build file arises. Modularizing jobs into doing one thing, and doing it
well, helps in any case. Let us take a look at the build step first.

```yaml
image: alpine

variables:
  HUGO_VERSION: "0.52"
  HUGO_SHA: "b4d1fe91023e3fe7e92953af12e08344d66ab10a46feb9cbcffbab2b0c14ba44"
  GIT_SUBMODULE_STRATEGY: recursive

before_script:
  - apk update && apk add openssl ca-certificates
  - wget -O ${HUGO_VERSION}.tar.gz https://github.com/spf13/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz
  - echo "${HUGO_SHA}  ${HUGO_VERSION}.tar.gz" | sha256sum -c
  - tar xf ${HUGO_VERSION}.tar.gz && mv hugo* /usr/bin/hugo
  - hugo version

build:
  script:
    - hugo -b "https://my.server.address/"
  artifacts:
    paths:
      - public
  only:
    - master
```

The build script is, in essence, identical to a build for GitLab Pages. We are
now telling hugo that our base domain is different by passing
`-b “https://my.server.address/”` which tells hugo how to target links
between its pages and where to search for static files. If you forked the
project from the example pages project you had to do the same already, just
change the address directly in `config.toml` instead of passing it through the
command-line.

## Deployment basics

We are now ready to start tackling the deployment to our server itself, which
will be the most difficult part of the whole process. The difficulty lies in
getting both servers to talk to each other (or at least our target server to
accept a connection from the GitLab runner), and still having it be secure
enough. We will not rely on passwords, since you should disable these
login methods for most servers’ ssh anyways.

Instead, we will rely on ssh keys to enable the connection. To start, there
are a couple of prerequisites: We need to create an ssh key and tell our target
server to accept ssh connections from this key. Then we need to supply the
GitLab CI instance with the private key, and preferably do so without exposing
it all over the log files that the pipeline creates when our deployment is running.

You should know how to create ssh keys (if you do not, take another look at the
linked DigitalOcean guide above). We will create a separate key for our
deployment process. This brings more than one advantage: We do not need to hand
over our actual, administrative private key to GitLab CI in any way, already
increasing security. Should the key inadvertently get exposed, we can remove any
authorizations from the key and switch it for a new one without impacting other
SSH work-flows. Lastly, we can target specific restrictions and permissions to
any connection using the key, thereby restricting access to anything but copying
files to a specific directory.

The basic premise of our deploy step looks as follows:

```yaml
deploy:production:
  stage: deploy
  before_script:
    - [install rsync]
    - [prepare ssh connectivity]
  script:
    - rsync -hrzv public/ "user@mywebserver.com:/path/to/web_directory"
  only:
    - master
```

To copy the files over we want to use rsync, a powerful tool which can copy
files over sftp, ssh. But before we get to configuring the _sending_ of files
let us prepare our server to _receive_ said files. We need to make sure it
accepts our ssh connection, restrict the things we can do over this connection,
and restrict rsync to working in the directory we want it to.

## Target Server Configuration

When we have created a new key-pair (I will call it `gitlab-ci` and
`gitlab-ci.pub` for our purposes) let’s make some changes to the files on our
server itself. First up, we need to edit `~/.ssh/authorized_keys`. You should
already have come across this file when setting up your actual administrative
ssh key. We will now add the contents of the _public_ key
`gitlab-ci.pub`, which we just created. Add it as a new line so that it begins
with `ssh-rsa [publickey goes here]`.

Before the beginning of the key we can add the option `command=""` with which we
can specify the _single_ command any ssh connection with this key can make use of.
We can also set some limits for the connection itself:
`no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding`
will disallow most connection options which an unwanted visitor can potentially abuse.

<!-- markdownlint-disable MD013 -->

```bash

ssh-rsa MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgH6gF8Wrr6y6X0rI3U6xatl986/7VDRiVXzxPrLbTywE4Ck6quymG7oqrPZz+k[...]
command="/usr/bin/rrsync /path/to/target/directory/",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding ssh-rsa vjJKakcmykbOA4RgshaB9PQiKvX4zSPsa/b61Q5bNhEbXJZtWLVa1Q05SpquWI6EQ7TafkhLn4QID[...]

```

<!-- markdownlint-enable MD013 -->

The command we are using, `rrsync`, restricts rsync to be able to operate in
whatever directory we pass in as an argument, and its sub-directories. Anything
outside the directory is off-limits. For the receiving end, we are pretending
that this directory is our root folder as far as rsync knows. Now, to get
the executable I am calling from `usr/bin/rrsync` we have to either unzip the
one that comes with rsync itself, or download it from the rsync website.

To download and make it executable run the following two commands:

```bash
sudo wget https://ftp.samba.org/pub/unpacked/rsync/support/rrsync -O /usr/bin/rrsync
sudo chmod +x /usr/bin/rrsync
```

If you want to unzip it from the rsync docs instead, just use the following
commands:

```bash
sudo gunzip --to-stdout /usr/share/doc/rsync/scripts/rrsync.gz > /usr/bin/rrsync
sudo chmod +x /usr/bin/rrsync
```

Doing so will put the executable in our path and the command in
`authorized_keys` will also function as it should.

## GitLab Configuration

With this accomplished, our server will let the `gitlab-ci` ssh key connect and
execute rsync as its sole command, and not outside our target directory. We can
return to our GitLab CI pipeline to set up the sender. Before you do so,
go to your **Project Settings > CI / CD > Environment Variables** and create
`SSH_KNOWN_HOSTS`, `SSH_PRIVATE_KEY`, `SSH_USER_HOST_LOCATION` with the
corresponding values.

![GitLab Environment Variables](/2019-01-29/gitlab-env-vars.png)

`SSH_USER_HOST_LOCATION` should be self-explanatory, it refers to the user name
you want to use, as well the server you want to deploy to. Be aware that there
is a mistake in the above picture. The variable is missing a colon and slash at
its end, the _correct_ form is: `user@servername.com:/`. Otherwise rsync will
think the variable is a folder on the machine itself, rather than an ssh
connection. `SSH_PRIVATE_KEY` is the _private_ part of the `gitlab-ci` key-pair
we created earlier – the one we just allowed to connect to our server. And
`SSH_KNOWN_HOSTS` is the public key fingerprint of your server. You can find the
public fingerprint with the command.

```bash
ssh-keyscan -t rsa myserver.com
```

Copy the output of this command into the variable – you can pre-pend it with
either your server address, your server ip, or both. If you just want
the variables to be visible to ‘protected’ branches in your GitLab repository,
you can flip the corresponding switches. [^protected-branch] With all this
set-up done, let us return to our `.gitlab-ci.yml` file to set up the file
deployment job.

## Crafting the deployment job

To send files through our job, we need to get the correct
environment variables into the job container. That means we need to install and
configure our ssh environment, set the correct ssh-key for our ssh-agent, and
set our target server as a known host so that no
man-in-the-middle-attacks are possible. We can do so with the following
`before_script` set-up:

```yaml
before_script:
  - "which ssh-agent || ( apk update && apk add openssh-client rsync )"
  - eval $(ssh-agent -s)
  - echo "${SSH_PRIVATE_KEY}" | tr -d '\r' | ssh-add - > /dev/null
  - mkdir -p ~/.ssh
  - echo "${SSH_KNOWN_HOSTS}" > ~/.ssh/known_hosts
  - rsync --version
```

This will try to find an ssh-agent or install the necessary packages to the
machine. Then we set arguments for the ssh-agent to 'eval' in bash. We add
the private ssh key to our agent, but redirect its output to null so that the
private key is not printed to our logs.[^line-ends] We create the .ssh directory
and add our target server as a known host. Just as I always like to do,
we print out the version number of rsync that we are going to use for our
transfer script.

This sets up all ssh variables both servers need to talk to each other, with one
being ready to receive in the target directory, and the other ready to
engage the connection. The transfer script is a simple rsync command:

```yaml
script:
  - rsync -hrzv --protocol=31 --delete --exclude=_ public/
    "${SSH_USER_HOST_LOCATION}"
```

This tells rsync to be human-readable (`-h`), recursively send sub-directories
along (`-r`), print the files it sends (`-v`), and compress the files for
transfer (`-z`). I also pinned the protocol version to the lowest value between
my server and the runner (you can find it with `rsync --version`), but this should
generally not be necessary. `--delete` tells rsync that it should overwrite all
files that are already in the target directory. We tell it which folder we want
to transfer – in our case the `public/` folder, since that is where our
build files ended up in.

We use the environment variable we set earlier to set the correct
server to send to. We do not need to specify a path at the target server, since
we used `rrsync` to let rsync exlusively see the target directory anyway. If we had
not done this in `authorized_keys` we would set
`user@servername.com:/path/to/target/directory` as our target.

## Putting it together

We have arrived at our complete build pipeline:

```yaml
image: alpine

variables:
  HUGO_VERSION: "0.52"
  HUGO_SHA: "b4d1fe91023e3fe7e92953af12e08344d66ab10a46feb9cbcffbab2b0c14ba44"
  GIT_SUBMODULE_STRATEGY: recursive

before_script:
  - apk update && apk add openssl ca-certificates
  - wget -O ${HUGO_VERSION}.tar.gz https://github.com/spf13/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz
  - echo "${HUGO_SHA}  ${HUGO_VERSION}.tar.gz" | sha256sum -c
  - tar xf ${HUGO_VERSION}.tar.gz && mv hugo* /usr/bin/hugo
  - hugo version

build:
  stage: build
  script:
    - hugo -b "https://myserver.com/"
  artifacts:
    paths:
      - public

deploy:
  stage: deploy
  before_script:
    - "which ssh-agent || ( apk update && apk add openssh-client rsync )"
    - eval $(ssh-agent -s)
    - echo "${SSH_PRIVATE_KEY}" | tr -d '\r' | ssh-add - > /dev/null
    - mkdir -p ~/.ssh
    - echo "${SSH_KNOWN_HOSTS}" > ~/.ssh/known_hosts
    - rsync --version
  script:
    - rsync -hrzv --protocol=31 --delete --exclude=_ public/
      "${SSH_USER_HOST_LOCATION}"
```

This `gitlab-ci.yml` file will, coupled with the correct configuration of the
target server, automatically deploy a hugo blog to whichever server you want.
You can see how the different ways of compiling and deploying build on each
other to pose more complexity, but also allow you to deploy you to any target
and with any amount of customization you want. Before we finish, let’s review
one last concept to bring the GitLab Pages and custom server deployments
together.

## Deploying to Staging and Production

One way to use the scripts we just built is to have a separate blog for
previewing at your GitLab Pages server, and the full, prime-time production
version of your blog at your actual server address, wherever that may be. To do
so, you can set different jobs in the `gitlab-ci.yml` file to run for different
branches of your repository and build on each other to deploy to the version you
are working on, or want to publish to. I will just lose a couple more words since
the concepts should now be clear, and the one thing that changes is the way
they combine to do whatever you want to. For further reading, as
always, check back at the [GitLab CI documentation](https://docs.gitlab.com/ee/ci/yaml/).

```yaml
image: alpine

variables:
  HUGO_VERSION: "0.52"
  HUGO_SHA: "b4d1fe91023e3fe7e92953af12e08344d66ab10a46feb9cbcffbab2b0c14ba44"
  GIT_SUBMODULE_STRATEGY: recursive
  STAGING_URL: "https://your-gitlab-name.gitlab.io/your-project-dir/"
  BLOG_URL: "yourserver.com"
  # I set my blog url as an environment var, so it is not visible everywhere,
  # but you can set it here instead.

stages:
  - build
  - deploy

# anchoring and inserting (mapping) onto another build-part - see https://docs.gitlab.com/ce/ci/yaml/README.html#anchors
.hugo_build_package:
  before_script: &get_and_verify_hugo
    - apk update && apk add openssl ca-certificates
    - wget -O ${HUGO_VERSION}.tar.gz https://github.com/spf13/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz
    - echo "${HUGO_SHA}  ${HUGO_VERSION}.tar.gz" | sha256sum -c
    - tar xf ${HUGO_VERSION}.tar.gz && mv hugo* /usr/bin/hugo
    - hugo version

build:staging:
  stage: build
  before_script: *get_and_verify_hugo
  script: hugo -d public -b "${STAGING_URL}"
  artifacts:
    paths:
      - public
    expire_in: 1 day
  only:
    - develop
# You can do except: -master if you want to deploy every intermittent commit
# to staging, same for the pages deployment.

build:production:
  stage: build
  before_script: *get_and_verify_hugo
  script: hugo -d public -b "${BLOG_URL}"
  artifacts:
    paths:
      - public
  only:
    - master

#deploy:staging -- pages job name necessary to be uploaded to GitLab Pages
pages:
  stage: deploy
  dependencies:
    - build:staging
  script:
    - echo "Deploying to Staging at ${STAGING_URL}"
  artifacts:
    paths:
      - public
  only:
    - develop

deploy:production:
  stage: deploy
  dependencies:
    - build:production
  before_script:
    - "which ssh-agent || ( apk update && apk add openssh-client rsync )"
    - eval $(ssh-agent -s)
    - echo "${SSH_PRIVATE_KEY}" | tr -d '\r' | ssh-add - > /dev/null
    - mkdir -p ~/.ssh
    - echo "${SSH_KNOWN_HOSTS}" > ~/.ssh/known_hosts
    - rsync --version
  script:
    - rsync -hrzv --protocol=31 --delete --exclude=_ public/
      "${SSH_USER_HOST_LOCATION}"
  only:
    - master
```

This is all there is to it. You can now mix and match build and deployment
targets to your hearts content. Go wild!

Thanks for reading.

## Appendix: Two common errors

### Is your shell clean – Rsync

Rsync sometimes prints out this rather cryptic error when trying to send files
to another server. As far as I can tell, there can be 3 culprits for this error:

1. The client/server have some output in .bashrc/.zshrc/.[whatever]rc > the
   shell needs to be clean for rsync to work. If you still want to show special
   output to users (in actual interactive shells), either make sure an
   interactive shell is running (though rsync may start an interactive shell as
   well), or put it in bash_profile to show it to the user but not on
   non-interactive shells.
1. There is some error of restriction/permissions/… – this leads to some shell
   output. When rsync does not _know_ it errors out, then it will display shell
   not clean instead. This can happen if using restrictions of commands in
   ~/.ssh/authorized_keys via the command=“” utility. Try it without and if it
   works, refine the command to be correct. See
   [using rrsync for restricted access](https://www.whatsdoom.com/posts/2017/11/07/restricting-rsync-access-with-ssh/)
   and the same article,
   [with fixed commands](https://www.guyrutenberg.com/2014/01/14/restricting-ssh-access-to-rsync/)
1. An actual rsync protocol mismatch. Simple rsync commands between slightly
   differing versions are not a problem for rsync. Transferring between
   different _protocol_ versions can lead to errors (more so if transferring
   from a newer to an older protocol). To find out protocol versions use
   `rsync -version` at the server/client machine. If (the server) has a newer
   protocol version, you can pin it to a specific version with `rsync –protocol=[version]`,
   where version is the protocol version number, like 28 or 31. If the lowest
   version number between server and client is 28, you would do
   `rsync --protocol=28`. A good idea is to print the rsync
   versions to the screen before attempting to sync whenever using rsync in a
   CI/CD scenario to simplify later debugging.

### Wrong ssh user location

When using rsync for CI/CD, the command tends to look like some variation of

```yaml
rsync -hrzv --protocol=31 --delete --exclude=_ public_html/
"${SSH_USER_HOST_LOCATION}"
```

with `${SSH_USER_HOST_LOCATION}` specified in the environment variables of
the respective CI pipeline and looking like some variation of
`username@serveraddress.com:/path/to/destination/dir`.

This works well in that it obscures the exact server address from the build logs
and encapsulates it in a variable to be easy to change, should the destination
server change. _But:_ If we make use of the restricted rsync version (see above
under ‘using rrsync for restricted access’), then this location changes. When we
run rrsync with a specific path under which rsync can operate, then _all rsync
operations happen relative to this ‘root’ path_. In other words, if we restrict
it to `command='/path/to/rrsync /path/to/destination/dir'` in
`~/.ssh/authorized_keys` then any rsync operation we call from the CI system
already takes place at our destination directory. Long story short,
`${SSH_USER_HOST_LOCATION}` should lose all path information that rrsync gains
in `authorized_keys` – in our case (and it most cases), this would make it:
`username@serveraddress.com` .

[^gitflow]: If this description reminds you of git-flow, I don’t think that is necessarily an accident. The two have a lot of useful overlap: If you think about your blog posts as ‘features’, they generally follow a similar structure of creation. If you want to experiment with using git-glow as your blogging workflow, consider [starting with how others are using it](http://asp.net-hacker.rocks/2017/04/03/blogging-with-git-flow.html). But before heading too deep into the git-flow woods, consider [its downsides](https://www.endoflineblog.com/gitflow-considered-harmful) and practical problems with the flow [for race conditions with more people posting](http://luci.criosweb.ro/a-real-life-git-workflow-why-git-flow-does-not-work-for-us/).
[^fun]: Also, remember: a lot of the initial draw to blogging, and maybe your reasons for automating deployments is having _fun!_ (And learning.) Try to keep it in mind before implementing rigorous organization, or when things don't go as planned in the following sections.
[^netlify-selfhosted]: Though I suppose you can create an integration with any self-hosted repository as well, it would just not be as _magic_ and behind-the-scenes as with the integrated providers.
[^compare-netlify]: This mirrors what we filled out for the deploy settings in Netlify earlier.
[^stages-jobs]: You can think of stages providing the general structure a build will follow, and jobs constituting the detailed build process, single steps along the path described by your stages.
[^docker]: It does so by spinning up a new docker container for each job, since every step of the process it built on docker containers.
[^predefined]: If you forked your repository from the Hugo Pages project above, you will already find a `.gitlab-ci.yml` file, ready to go and deploy. You can still follow along to learn what the individual lines to in the script.
[^per-job-image]: In reality, we are supplying it as the underlying system for _all_ jobs in our file, it’s just that we currentliy have the one job on there. If we were to add another job besides `pages` to the file, it would also use the alpine image. But we can also supply an image for the `pages` job specifically, by putting `image: alpine` indented underneath the job, together with the other parameters and another image underneath other jobs to have individual images. Any valid docker image can serve as the image for GitLab to use. This can be useful for more complicated build and deploy processes but is not necessary for us right now.
[^recursive-submodules]: The recursive submodules variable recognized by GitLab CI is a recent addition. Before that was possible another way to get the submodules is to include the steps manually as part of the `before_script` part of our build script: `- apk add git && git submodule init && git submodule update --force`
[^protected-branch]: By default, master is the unique protected branch. You can set your branches to protected in the GitLab Repository options. Protecting a branch means that no one can delete it, no on can force-pushe to it, and just select people can merge into it.
[^line-ends]: The `tr -d ‘\r’` part of this line exists since, if we handled our key-file on Windows when we set the environment variable on GitLab – or systems with non-unix line-endings – its line-endings would confuse the ssh-agent. The private key would not correspond to the public key we set on our server earlier, and the connection would fail. This strips the wrong line-endings out of the variable before handing it over. This error tripped me up for a long time before finding a working solution, and this snippet is now the recommended way to add private keys from environment variables.
