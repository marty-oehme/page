---
title: "Everyday jujutsu for the working copy and editing"
description: Eight workflows that make my version control life good
pubDate: 2026-11-22T18:41:58
type: technical # technical|analysis|essay|note
topics: # command-line|data|hosting-infrastructure|linux|programming|python|task-management|version-control
  - version-control
# series:
#   id: jujutsu-workflow
#   order: 1
tags:
  - jujutsu
weight: 10
---

To recap from my previous posts on Jujutsu:
Jujutsu (jj) is a Git-compatible version control system:
it stores history in a normal Git repository, so you can adopt it in an existing
repo, keep using GitHub/GitLab, and let teammates and CI see ordinary Git.
What it changes is the user model.
Think of it, in a distant sense, like an additional interface to the git
plumbing underneath.
That's underselling it a little, but this mental map will make your initial
switch much easier when you want to try it out.

This article is a collection of actions, workflows and procedures which I find
noticeably easier in jj than in Git, with a short description, some examples and
the reasons _why_ I find it easier here.

That doesn't mean you have to have the same pain-points, experiences, or even
agree with me on all of them (hey, maybe you love the way you split an
overloaded commit in Git).
The below is my opinion based on my small research into why I consistently reach
for jj over Git for the last 2 years for any version control needs, but maybe it
also helps out someone else to better understand the different approaches of the
two systems, and how you can make use of them.

_Research notes and hands-on examples, all tested with jj 0.42.0 on Linux._ _jj
is still pre-1.0, and has some command churn, so command names and flags may
have changed by the time you read this._ _Always check `jj <command> --help`
when in doubt._

## The ideas behind most of the wins

In Git you have three states -- dirty working tree, index, commit -- a current
branch, and a bunch of modal operations (merge, rebase, bisect, detached HEAD).
In jj, there are four fundamental differences driving the work behind the
scenes:

- The working copy is a commit:
  It is `@`, it is always snapshotted, and it has a description like any other
  commit.
  There is _no_ staging area and _no_ separate "dirty" state.
- A change has a _stable_ change ID and a _mutable_ commit ID:
  Rewriting a commit changes its commit ID but keeps its change ID, so
  descendants, bookmarks, and your own references follow it.
- Rewriting is a first-class operation on the commit graph, not just a sequence
  of patch applications to files.
  Descendant changes are rebased automatically.
- The operation log records every operation on the whole repo:
  you get undo/redo operations which work at the level of 'the entire repository
  state'.

Most of the jj items that follow are consequences of one of those four
properties.

Let's begin with items that you will come across quickly and that are noticeable
every day on almost every operation you do in your versioned repo.

_Note:
I will try to use the long-form options in jj, unless they are identical to the
git versions.
That means some commands will look longer than they are in daily use._ _I will
also generally use the word 'revision' to refer to what are essentially jj
commits._

## 1. No need to stage: every non-ignored file is tracked when you look

**TL;DR:** There is no `git add`.
Files in the working copy are snapshotted automatically, and `jj status`/`jj
diff`/`jj log` see them immediately.
This completely alters the way you think about your change workflow.

If you know anything about jj, this one you will surely know already.
There is no `git add` anymore, there is no more staging area, and most
importantly for this section, there is no more `git restore --staged`.

Right off the bat, I think this proved one of the most divisive changes of the
new approach:
every change you make in the repo is automatically versioned.
Just because it's such a fundamental change in approach let me repeat it
quickly:
_every_ change you make in the repo is _automatically_ versioned (aside from
explicitly ignored files).

Many people used to the git workflow adjust some files, work on some code, then
`git add <specific> <files>` exactly on those files, or even `git add -i` or
`-p` for even more fine-grained control over what you want to version and
nothing else.

In a certain way it makes sense, especially for those of us who are used to
working with git for so long.
You take care to only put those changes into the staging area you are really
happy with, and afterwards you 'commit' to preserving those, and _only_ those.

But, when you really think about what that means on the other side, you don't
really _version_ most of your in-between changes, and those can get lost much
more easily.
Okay much of the time; disastrous in those instances where you _really_ needed
to pivot back to an earlier idea or implementation that you never staged or
committed.

jj gets rid of this differentiation in your brain completely.
Wrote something new?
It's tracked.
Making some changes right now?
They're tracked.
Want to try something crazy while you're in the flow already, but you're pretty
sure it will just be garbage?
It's tracked, just throw it in a new change and don't think about it.

```sh title=git
$ echo 'print("hi")' >app.py
$ git status --short
?? app.py
$ git add app.py # explicit staging step
$ git commit -m "add app"
```

The mental model in git is generally:

- I write some code
- I pick some of the code which creates a coherent change
- I describe that change in a commit message

In jj this is still _supported_ (but I would not recommend the following way):

```sh title=jj
$ echo 'print("hi")' >app.py
$ jj st
Working copy changes:
A app.py
$ jj commit -m "add app" # describes @ and starts a new empty working-copy commit
```

Let's look at the same in a bit of a different light.
We'll apply the same mental model but use more jj idiomatic commands:

- I write some code
- I pick (`jj split` or `jj split -i`) the code creating a change
- I describe that change in a change message (`jj describe @-`)

```sh title=jj
$ echo 'print("hi")' >app.py
$ jj st
Working copy changes:
A app.py
$ jj split app.py             # explicitly isolates change into their own change
$ jj describe -m "add app" @- # describe commit, technically unnecessary since split already describes
```

But you can already see a fundamental change in the describe command.
Since we are _always_ 'on' a change in jj (what would be the staging area in
git), we don't `add` changes into it, but we `split` out the code that we are
really happy with.
The `describe @-` then describes the _previous_ change, containing the code we
just split off.

Once this difference becomes more natural it opens up so much more flexibility
in the way you approach writing new features or coherent changes.
For example, I will often now 'pre-describe' what I _want_ to implement before
writing any code.
Once the code is written, if there's other stuff I did, I can have a reminder
that it doesn't belong in my original changes, and split and organize
accordingly.

- I describe what I want to do (`jj describe`)
- I write some code to do it
- I move on, or, if other code snuck in, I split (`jj split`) and then move on

A simile for those of you who use emacs:
it feels like the magit quick-fire hunk staging and unstaging is already baked
into the change creation process.

```sh title=jj
$ jj describe -m "add app"    # describe commit
$ echo 'print("hi")' > app.py
$ jj new                      # ready for the next change
Working copy  (@) now at: ynrktkyr 1e3e0a6c (empty) (no description set)
Parent commit (@-)      : kmsywosn 2dc68e09 add app
```

The nice thing is:
you can mix and match those approaches as you want.
Prefer the git 'write first then select what to keep' approach?
`split` them off.
Prefer to work bit-by-bit?
`describe` then `new` each change.

The important part is that each time something changes:
everything is recorded into a change.
You can't lose progress at (basically)[^lose-progress] any point.

[^lose-progress]: Okay, if you try really hard you definitely can.
`jj` is not a daemon.
It will only snapshot your changes every time any `jj` command runs - so if you
write hundreds of lines, never run a `jj` command in the repo again, and then
delete a file, you may lose the progress.
But realistically, this is not going to happen, and at parity with Git if it
does.

The "did I stage that?" failure mode disappears.
There is one state to reason about:
the content of `@`.
You also cannot forget a new file:
it is already in the change.
Git users often describe this as collapsing "dirty, staged, and committed" into
"committed".

Read more at:

- <https://jj-vcs.github.io/jj/latest/git-comparison/>,
- <https://news.ycombinator.com/item?id=41895056> (steveklabnik:
  "instead of dirty, staged, and committed, you just have committed").

### 2. Stop stashing: your WIP is already a commit

**TL;DR:** To switch tasks, start a new commit somewhere else.
Your unfinished work stays behind as a normal commit; jump back with `jj edit`.
Commits (or, more correctly, 'changes') are the only thing you think about.

Most of us know the pain of working on something in git, having to switch track
mid-implementation, and having all this half-implemented _stuff_ in the way all
of a sudden.
Git provides stashing for this purpose:
you essentially create a temporary commit, put all that _stuff_ in there, and
work on something else.
When you're done with the else, you apply it back and continue working on it.

```sh title=git
$ git add changes-here.py
$ git stash push -m "WIP"
Saved working directory and index state On main: WIP
$ vim urgent.py
$ git add urgent.py
$ git commit -m "urgent fix"
$ git stash pop               # conflicts are possible here
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
  new file:   changes-here.py

Dropped refs/stash@{0} (e2e51ca7f9b16ffcc7b4920aa47edfaef35f0da7)
```

There are two issues I always had with this:

1. It feels too encumbered.
   Often I would later lose track of which stash did what and why I needed to
   stash stuff in the first place.
   I know that's user error, but it still interrupted my flow in a negative way
   when it happened.
2. It can conflict when you pop the stash and, boy, did I hate those moments.
   You then have to go through the WIP changes in your stash to figure out what
   conflicted, why, which parts were already really important to keep for an
   implementation and what could be ignored, and so on.

In jj, you simply create a new empty change on the previous commit (`jj new @-`)
and directly start working on the urgent issue.
Remember, everything is always snapshotted, so all your in-progress changes
aren't going anywhere.

```sh title=jj
$ jj new @-                 # park current work; new @ is its sibling
Working copy  (@) now at: tymzzlmv 9ae4a816 (empty) (no description set)
Parent commit (@-)      : kmsywosn 2dc68e09 main | add app
Added 0 files, modified 0 files, removed 1 files
$ vim urgent.py
$ jj describe -m "urgent fix"
Working copy  (@) now at: tymzzlmv 71061c1b urgent fix
Parent commit (@-)      : kmsywosn 2dc68e09 main | add app
$ jj edit y   # back to the unfinished work (y being short <revision>)
Working copy  (@) now at: ynrktkyr ea1664a0 WIP: implement that super feature
Parent commit (@-)      : kmsywosn 2dc68e09 main | add app
Added 1 files, modified 0 files, removed 0 files
```

Happy with the changes?
Just jump back to what you were doing previously with `jj edit <old-change-id>`.
No need to pop anything, apply any changes, and thus no danger of stash
conflicts.
Of course, when you finish and then actually merge or rebase the changes you are
now working on may conflict with the main trunk, but with jj's deferred conflict
handling you can wait for an opportune moment to resolve those.

Just like we have no 'stage' state to reason about, there's no 'stash' objects
to take care of, with their own lifecycles and conflict behaviors.
Everything is a Revision and we always use the same interaction verbs for
editing them.
For me at least, this makes context switching so much easier, since it mirrors
the commit navigation I do daily anyway.
As a bonus, my 'stashes' (i.e. unfinished ideas) can be easily visible in the
main `log` (though, again, yes this can also be accomplished in Git).

Read more at:

- <https://jj-vcs.github.io/jj/latest/git-command-table/> ("git stash" → "jj new
  @-")
- <https://tonyfinn.com/blog/jj> (on the reduced number of concepts you have to
  deal with)
- <https://news.ycombinator.com/item?id=45083952#45084298> (user stavros on
  stash switching being "so fiddly")

### 3. Amend any commit, not just the last one

We are slowly moving toward the features I really can't do without anymore.
The previous items are the foundation for quick commit-bouncing and working
anywhere, but this is one I simply adore.

Let's start with Git:

```sh title=git
# last commit
$ git add src/parser.py
$ git commit --amend --no-edit

# an older commit
$ git add src/parser.py
$ git commit --fixup=<parser-commit>
$ git rebase -i --autosquash <parser-commit>^
```

It's easy to amend additional changes into the commit you just made, but it gets
a little more tricky to add them into an arbitrary commit along your commit log.

In jj, I can do it in one command:
`jj squash --into <rev> <paths>`.

You move the changes from the current working copy revision into any revision
you give.
Can't provide your changes cleanly as files or a fileset?
Use `jj squash -i --into <rev>` and choose with an interactive picker.

As always, jj takes care of rebasing all descendant commits automatically.
If I had to describe it, I would say it feels like consistently working in Git's
interactive rebase mode for any history-editing command, just without the extra
complexities that come with it.

The reason for this difference is, once again, that in git you first 'stage'
your fix, create a fixup commit, and then squash that into the target commit.
Since we are always 'staged' in jj in a way, this becomes a single operation.
I do this so often, every day, because it just makes it so rapid to quickly
improve some phrasing in a comment or fix a typo or some other small change,
that I don't even have to consciously think about it anymore.
No index manipulation required, no rebase todo list to work through.

To 'amend' the parent commit like in Git is even shorter by simply doing `jj
squash` without providing an explicit revision ID.
It will default to this revision's parent if it can.
By the way, you can also squash _from_ an arbitrary revision _into_ an arbitrary
revision:

```sh title=jj
jj squash --from <rev> --into <rev> <files>
```

No need to even be near the commits you are touching.

Read more at:

- <https://jj-vcs.github.io/jj/latest/git-experts/>,
- <https://jj-vcs.github.io/jj/latest/git-command-table/> (“git commit --fixup +
  rebase --autosquash” → “jj squash --into”).

### 4. Absorb review fixes into the commits that caused them

Going beyond a single fix -- what if you have multiple fixes in multiple files,
all throughout your repository and want to 'overwrite' the original approaches
with them?

Let's say you provided a PR for some project and the review requested some
changes that you made in response.
Now it's time to apply them and rewrite the history so it still makes sense
before merging.

In Git this becomes quite tedious, depending on the amount of changes:

```sh title=git
$ git add -p                  # stage the hunks belonging to <parser-commit>
$ git commit --fixup=<parser-commit>
$ git add -p                  # stage the rest for <renderer-commit>
$ git commit --fixup=<renderer-commit>
$ git add -p                  # and so on for the rest
$ git commit --fixup=<formatter-commit>
$ git rebase -i --autosquash <oldest-target>^
# (or use the third-party `git absorb`)
```

As per the previous section, add each change into its own commit, squash it as a
fixup commit into the respective commit that introduced those lines.

Of course, the same can be done with a single interactive rebase after having
created the individual commits, but the principle remains the same.

In jj, this becomes one command yet again:
`jj absorb`.

It writes each _changed_ line of the current working copy into the _last commit_
that touched that line.

This will be all that's required, provided it isn't a convoluted fix with
multiple changes to the same line or somesuch.
It will work for the majority of your multi-file squashing needs, like magic.

```sh title=jj
$ vim parser.py renderer.py      # review fixes
$ jj absorb
Absorbed changes into 3 revisions:
  mmwrtzsp af76eabd Add renderer
  omzkyvtp ac208745 Add parser
  ypuwpspw 2629799b Add formatter
Rebased 1 descendant commits.
Working copy (@) now at: rzxywvvp 91f65078 (empty) Review fixes
```

Internally, `absorb` inspects the diff in `@`, then, for each hunk, finds the
(mutable) ancestor commit that last modified the affected lines, and directly
squashes the hunk there.
Then it rebases all descendants and reports which commits it changed.

It refuses to move any lines that were modified differently in multiple commits,
so it doesn't accidentally remove or change e.g. previous reworks.
By focusing on mutable commits it also doesn't try to rewrite for example the
`main` branch on a remote repository.

Any changes left-over that couldn't be automatically absorbed will simply remain
in the working copy, ready for you to manually work on.
Changes routed to the right commits in a single command, an absolute time-saver
that blew my mind when I first tried it.

Read more at:

- <https://til.codes/the-magic-of-jj-absorb-rewriting-history-without-the-pain/>,
- <https://docs.jj-vcs.dev/latest/git-experts/#jj-absorb-makes-it-easier-to-update-a-patch-stack>
- <https://bojanstipic.com/blog/switching-from-git-to-jujutsu>.

### 5. Split one blob of work into reviewable commits

We went over this in the earlier section on the fundamental approach to editing
without staging, but just like `squash`, `jj split` is an integral part to most
of my coding sessions.

```sh title=git
# split the last commit
$ git reset HEAD^
$ git add one.txt
$ git commit -m "one.txt only"
$ git add -A
$ git commit -m "remaining changes"

# for an older commit:
$ git rebase -i <commit>^ # mark it `edit`
$ git reset HEAD^          # and then commit the pieces
```

Let's rehash:
`jj split <paths> -m "message"` extracts the selected (file-level) changes into
a new commit (_below_ the revision being split), while `jj split -i` will open
an interactive diff editor for you to select hunks or lines to extract into a
new commit.

```sh title=jj
$ jj split one.txt -m "one.txt only"
# one.txt's changes become a new commit below the original;
# the original keeps everything else.
```

Once again, since you are technically always on a 'commit' already (the working
copy), this just removes some steps from your mental workload.
Select the pieces to split off in whatever way feels best, name them and be
done.

Let me take this opportunity to also mention that jj uses a
[fileset language](https://docs.jj-vcs.dev/latest/filesets/), so wherever I said
to select files or paths above, you can glob and select multiple locations at
once in your command.

Simple example?
Split all changes you recently did in top-level Python files:

```sh
jj split -m 'only python changes' glob:"*.py"
```

Slightly less simple example?
Split all changes you recently did in your source tree, _except_ for those in
any Python files within that tree:

```sh
jj split -m 'avoid python changes' 'src ~ glob:"**/*.py"'
```

By the way, combined with number 8 on this list, a selection like this can also
be useful to quickly remove any files that may have snuck in with your snapshot,
like `.pyc` files or other cruft (since we always commit any changes).

As with other commands, you can target your split to any arbitrary revision, it
doesn't have to be your current working copy:
`jj split -r <revision> that-old-file.py`

As always, while it is _possible_ in Git, it is (to my mind) inherently easier
and involves less mental overhead to achieve in jj:
staging, committing, unstaging, and often interactive rebasing become a simpler
`split` which directly edits the commit graph and gives you the correct
parent/child relationships for free.

Read more at:

- <https://jj-vcs.github.io/jj/latest/git-command-table/>
- <https://v5.chriskrycho.com/essays/jj-init/>
- One caveat:
  the interactive split UX is still up for debate, see
  <https://github.com/jj-vcs/jj/discussions/1905>.

### 6. Reword any commit without an interactive rebase

Okay, once you grok the way git interactive rebases work, this also becomes
relatively trivial to achieve, but to me it's still a workflow win that the
function is baked right into the basic jj command you use to name and describe
commits anyway.

In Git you would typically do:

```sh title=git
# for the last commit
$ git commit --amend -m "parser: handle empty input"

# for older commits
$ git rebase -i <rev>^ # then change `pick` to `reword` for <rev>, save, edit the message
```

In jj, this can be handled in the following ways:

```sh title=jj
$ jj describe -r <rev> -m "parser: handle empty input"
Rebased 3 descendant commits.
Working copy  (@) now at: tswolqsv ac3a1a47 (empty) (no description set)
Parent commit (@-)      : tymzzlmv bf246f84 (empty) urgent fix
$ jj describe -r <rev>          # directly opens editor for that commit only
```

The description is metadata on the change and changing it rewrites the commit
and automatically rebases its descendants, as with other commands.
No need to explicitly `reword` from `git rebase -i`, and not even an editor
session is necessary if you don't want.
It becomes a direct targeted operation on a revision.

Read more at:

- <https://v5.chriskrycho.com/essays/jj-init/>
- <https://jj-vcs.github.io/jj/latest/git-command-table/>

### 7. Restore files from any revision, or undo one revision’s changes

Once again, in Git we are often required to 'checkout' a specific revision to be
able to restore the files from that revision into our current dir as staged
items.
But restoring files takes different forms, for example:

```sh title=git
git restore --source=<rev> --worktree --staged src/config.toml
```

And to re-apply a previously made commit in 'reverse':

```sh title=git
git revert <rev>            # new inverse commit, not a rewrite
```

This will restore a specific file from a specific source commit into the current
stage or create an inverse commit which reverts the changes of the target one.
Makes sense conceptually, but still remains somewhat confusing each time I
actually need to reach for them -- which one did what I wanted again?
Also, if you want to do the same for an already existing arbitrary commit,
you'll need to work with the interactive git rebase again.

In jj we can `jj restore` from and into arbitrary revisions again:

```sh title=jj
jj restore --from <rev> src/config.toml # copy that file from <rev> into @
```

```sh
jj restore --changes-in <rev>             # undo the changes in <rev>
```

As with other commands, this can also be done `jj restore -i` interactively.

Without sounding like a broken record, what was _doable_ but conceptually more
demanding for me previously, now just fits as a single 'verb' doing an 'action'
into my brain:
`jj restore` does one thing and that is 'get my file back' from wherever.

You can also the revert the effects of a single change (the diff of that
revision against its parents) by doing the following:

```sh
jj restore --from <parent> --into <merge> # revert a merge's effect
```

This is useful to back out of a single change, while keeping later work intact
(it restores the whole tree to that parent).

In this workflow in my mind it's really just a case of Git's UX not being very
clean.
The operation is spread around multiple subcommands (`checkout`, `restore`,
`revert` or `reset`) and gives you different behaviors for the index and the
working tree.
In jj you have one command, provide an explicit source, and an explicit
destination revision, and as always descendants rebase on each modification.

Read more at:

- <https://jj-vcs.github.io/jj/latest/working-copy/>
- <https://jj-vcs.github.io/jj/latest/FAQ/>

### 8. Discard a commit with `abandon`, not `reset --hard`

Lastly, this one is really small but a personal bugbear of mine.
Let's start with Git command:

```sh
# at the tip only:
$ git reset --hard HEAD^
```

As always, if you want to target arbitrary commits, the usual route is an
interactive rebase instead.

Now, here's what this command does:

- it moves a branch
- it destroys working-tree state
- the old tip can only be recovered from the reflog
- had any uncommitted working-tree changes?
  not recoverable

Yes, it's ultimately logical what you end up with.
Yes, it's specifically named `--hard` so you know what you're getting into.

But I am still every now and again surprised by the results and have to reflog
my way out of them.

In jj:

```sh title=jj
$ jj abandon <bad-change>
Abandoned 1 commits:
  tymzzlmv bf246f84 (empty) urgent fix
Rebased 1 descendant commits onto parents of abandoned commits.
Working copy  (@) now at: tswolqsv 0fee4c07 (empty) (no description set)
Parent commit (@-)      : kmsywosn 5239030b main | add cool app
$ jj undo                    # if you change your mind
Undid operation: 6a39adf5a739 (2026-11-22 17:52:41) abandon commit bf246f8409dfa56f4a732ae8b4fb3206abf67e66
Restored to operation: f7ec959385fd (2026-11-22 17:28:58) describe commit 2dc68e09a85c8b72ea85db2d69d753139ffb040a
Working copy  (@) now at: tswolqsv ac3a1a47 (empty) (no description set)
Parent commit (@-)      : tymzzlmv bf246f84 (empty) urgent fix
```

`jj abandon <rev>`, as the name suggests, removes a single commit,[^revsets] and
as with all other commands, it rebases its descendants, this time onto its
parent.
It just pops a single commit in the graph out of existence.

[^revsets]: By the way, almost any command I have given above that can receive a single
change ID can also receive a range of them via what jj calls 'revsets'.
So, you could abandon a whole number of changes at once.

And when you notice you messed up?
`jj undo` and it's right back where you started.

Much less scary to me and way less hesitance to do-and-revert before having to
think too hard about it.
I have even _bound an alias_ to it, `alias jab='jj abandon'`, which I wouldn't
have dreamed of doing in the Git world.

Additionally, you can `--retain-bookmarks` so your 'branch' (well
branch-equivalent) information isn't lost either.

Like I said, this isn't technically anything Git is doing wrong, but
instead of a small stop-and-stare moment in Git it turned into a daily command
like every other command in my jj usage.

Read more at:

- <https://jj-vcs.github.io/jj/latest/git-command-table/> ("git reset --hard" →
  "jj abandon")
- <https://jj-vcs.github.io/jj/latest/operation-log/>

## Conclusion

Git is powerful software, no doubt, and I will not downplay the power it brings.

But even after using it intensely for multiple years, teaching it to others, and
even holding a few workshops on it, there are still operations on git that I
will always have to look up.
The combination of multiple required commands with sometimes (to me) confusing
action naming will just not land in my head for long enough to re-use when I
require it the next time.

jj makes this easier for me by providing simpler one-command operations and
providing a (relatively) consistent set of options that behave similar across
commands.

Personally, nowadays, I will always reach for jujutsu -- if I can -- instead.

While I get excited about the conceptual thinking and structural implementation
_behind_ git, this is the first time I can get excited about the interface I use
to _interact_ with it.

It may be partly the shininess of new tools we all fall victim to, but I have
now worked long enough in the jj ecosystem to be able to confidently state that
its workflow improves my efficiency when working.

Going back to the actual `git` interface feels slow and sluggish for my needs now
in comparison.
No doubt, some of this comes down to practice -- I simply haven't _actually_
used Git much in the last year or so, except for a few repositories that still
require it.

If any of the above sounded like an improvement to you too, let me be the
resident Jujutsu shill and gently guide you to
[their webpage](https://jj-vcs.dev).
Try it out, I promise after getting over the initial 'where's my staging'
weirdness, it will feel less alien than you may initially think.

And if not, hey, you can say you tried and it's not for you, no problem with
that either.

<!-- TODO: Remove if turning into series -->

There are a _bunch_ more workflow improvements small and big that I have found
while thinking about my usage, and I may turn this into a series documenting
those as well, if I find the time.

Thanks for reading.
