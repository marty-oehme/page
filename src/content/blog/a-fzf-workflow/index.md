---
title: "Fuzz your terminal"
description: "A description of a variety of different uses for fzf"
pubDate: "2020-08-02T12:42:25+02:00"
weight: 10
tags:
  - commandline
  - fzf
---

<!--
## Gameplan

* use fzf on the commandline
  * manually invoking commands (search directory, history, etc) [yt explanation](https://www.youtube.com/watch?v=qgG5Jhi_Els)
  * aliasing commands (zhfind,..)
  * invoking it through zsh shortcuts
  * switching to fzy
* use fzf in vim
  * find files / buffers and open them
  * use fzf with ripgrep/ag/ack to enable full-text search
* use fzf and ripgrep/ag/ack for a notational velocity -like note creation workflow
-->

## A variety of workflows using fzf

[fzf](TODO-INSERT-LINK) has been one of the show cases of a successful, relatively recent command line tools.
It is a relatively recently developed tool
which seemingly brought a true sea-change to how many people use and navigate within their terminal.
[^fzfrecent]
On its surface, it provides a simple idea --
don't just look for _exact_ words, fuzz them a little instead --
but executes it so well that it truly changes the experience of interacting with your shell.

[^fzfrecent]: Its license points to 2013 as the start of development, the first git commits stem from around 2014.

There are already a bunch of ways of working with fzf floating around on various blogs,
but I decided to still add my voice to the choir.
This is for two reasons:
space on the web does not seem too scarce,
and the kilobytes that this page occupies should fit.
And, `fzf`, being a tool true to the Unix philosophy of doing one thing well,
integrates nicely into all sorts of other applications.
The combinatorial possibility space of combining applications is huge,
so maybe I found a use case you have not considered yet.

What we will cover in the following sections is:

- basic `fzf` ideas
- integration with some (`zsh`) shell tools (notably its history, man-pages, tab completion)
- integration with `yay` (though this can of course be adopted for `pacman`)

What we will _not_ be covering in the following sections,
but would love to get into whenever I find the time is a basic integration with `tmux` (session selection), and more advanced integrations within `vim` (for file and buffer navigation, full-text search, and zettelkasten navigation).

If you are interested in those, for now,
you will have to make do with rummaging through my [dotfiles](https://gitlab.com/marty-oehme/dotfiles).
Some are already documented a bit but since dotfiles are often in flux,
the docs will never be fully up-to-date, I fear.
Look especially for the `tmux`-session chooser in the `tmux` module,
and some `:Fzf`-commands in the `nvim` module to find out more.

## The basics

<!--
  * syntax
  * default command
  * using it in other commands
  * preview windows

TODO remember to switch to base path from content/post for production
{{<video webm="/2018-07-23-browser-quick-searches/thesaurus-dict.webm" >}}
-->

If you just enter `fzf` as a command,
the program initiates `find` in the current working directory and displays a list of all found files to fuzzily search through.
While that can be useful, we want more flexibility by connecting it to other tools we already use.
So, how does that work?

<video src="a-fzf-workflow/basics.webm" type="video/webm" loop controls autoplay>
</video>

Basically, `fzf` can be fed any list of values through its `stdin`, which it will then allow you to filter fuzzily.
As mentioned, by default it is fed by the `find` program.
It will then pass through to its `stdout` your selection (or selections, if multiple).
Of course, we can then use this selection to pass into other programs to actually do something with it.
In the version above, it would for example be a good idea to feed the results into `cat` or `less`:

`fzf | less` or `fzf | cat`

Or, we could directly invoke `vim` with the output of the command, so that we can edit the note we want.
Since we pass the file for `vim` to open as an argument, we can do so with the following command,
which gets the results from fzf and passes them along:
`vim "$(fzf)"`.

<video src="a-fzf-workflow/basics-vim.webm" type="video/webm" loop controls autoplay>
</video>

So that is the very basic usage of fzf,
but what if we don't want to use the files of our current directory as choices?
By passing something to `fzf`'s `stdin`, it will use those choices.
For example, `find ~/documents/notes/ -type f | fzf | xargs less` will let you search through the names of your notes,
regardless of which directory you are currently in.

Of course, we can pass anything into `fzf`, not just the contents of directories.
How about searching through a little to-do list for example?
If we have access to it in plain text, we can just do `cat ~/documents/todo.md | fzf | less` to select an entry to display.
Or we can go further:

`nvim --headless "+%s/^$(cat ~/todo.md | fzf)/[x] \0/" +wq`

The convoluted string above loads the content of your to-do list into `fzf` and waits for you to select an entry;
then it starts `neovim` without showing you its interface,
searches for the entry in your file and prepends it with `[x]` to mark it being done.

<video src="a-fzf-workflow/todo-vim.webm" type="video/webm" loop controls autoplay>
</video>

Although please be aware that the above way of doing it serves mainly as a demonstration of what is possible and is not the most efficient way of accomplishing the task!
[^bettertodo]
With a bit of tinkering, these concepts, by the way, are basically already enough to get started building a full-text search engine for your plain text files.

[^bettertodo]: There are other ways to accomplish this, notably with `sed`, which would be more efficient. Mainly this is to mirror the above steps going from `less` to `vim` and to show that you can pipe pretty much anywhere. We could, for example accomplish something similar with (gnu)`sed` by using `sed -ie "s/^$(cat ~/todo.md | fzf)/[x] \0/" ~/todo.md` instead.

Before we look at some examples,
I think highlighting the preview window of `fzf` may also be useful.
The preview window is a powerful concept --
it simply runs another command for whatever entry you currently have selected and displays its output together with your results.

Examples might be to display the contents of text files as you are choosing them
(useful for the notes search we created above),
or showing the contents of directories as you hover over them
(useful for the basic `fzf` + `find` functionality if you want to use it for navigation).

To get a preview into our notes for the function we created earlier,
a simple way to accomplish it is:
`find ~/documents/notes -type f | fzf --preview='cat {}'`.
This will: 1. Execute the directory-independent search as before; 2. Call `cat` with the currently selected entry as its argument (passed along instead of `{}`).

<video src="a-fzf-workflow/basics-preview.webm" type="video/webm" loop controls autoplay>
</video>

The contents of our notes are now displayed directly next to its entry so that we can have an idea of what they contain.
[^spaceissue]

Also take a look into `fzf`'s manual with `man fzf`.
It is very well documented and possesses a ton of flags and options with which its behavior can be changed to your liking.
Armed with this knowledge, let's dive into some examples --
from basic uses to more advanced integrations.

[^spaceissue]: Usually, you would also have more space available to display the contents. With the tiny frame being recorded for this animation, it does look a bit weird.

## Basic shell integrations

We will now walk through creating `fzfhistory`, `fzfman`, and `fzfyay`
to search through our shell history, man-pages, and repository packages respectively.
Of course, you can name the commands whatever you want --
but grouping them into the `fzf`-namespace has been working well for my semi-porous brain.

## Fuzzy history

In your shell,
if you have [set it up](https://www.soberkoder.com/better-zsh-history/),
you can see a history of all your previously typed commands.
Now, when I want to remember one of the more rare commands that you just need every now and again, this list is really useful.

But scrolling through its entries one by one doesn't seem practical,
and if I wanted to `grep` through it I would need to know the exact command I typed previously --
and that's the reason I am looking in here in the first place!

So whenever you find yourself thinking, 'how about a less exact version of this',
you already know `fzf` can come to your rescue.

<video src="a-fzf-workflow/fzf-history.webm" type="video/webm" loop controls autoplay>
</video>

The `fzfhistory` command is just a simple alias that I have defined as follows:

`alias fzfhistory="history | fzf --tac --height 20"`,

and `history` in turn is aliased to:
`alias history="fc -l -d -D 0"`,
which invokes the standard `zsh` history and shows it to you from the very first entry,
with time-stamp, execution time.

The result is a function I can quickly invoke whenever I have a vague memory of a command once used, and which is quick to explore.

Of course, you could extend this functionality to also _run_ the command you select,
substituting your shell of choice:
[^autoexec]

`zsh -c $(fzfhistory | cut -f7- -d' ')`

[^autoexec]: I consciously decided against this however, since I would rather have the safety of manually typing it before running anything.

## Fuzzy manpages

How about searching _all_ available man-page topics in a fuzzy way?
This search kind of mirrors what we have been doing previously,
but it involves a bit more manipulation of our results.

The full code to achieve it is as follows:

```sh
fzfman() {
  man "$(apropos --long "$1" | fzf | awk '{print $2, $1}' | tr -d '()')"
}
```

Now, this time our command is a function since it is a little more involved than the previous aliases.
Still, it's no rocket science: `apropos --long` parses all possible topics from our current man-page database, to which we can pass an initial topic as an argument if we so desire.
[^filteringman]
We then pass the whole list to `fzf` which is fortunately quite fast --
it works basically instantaneously for my 25668 man-page topics, after they have been initially built.

The selected topic is then passed from `fzf` to `awk` for column-based wrangling.
We take an initial string like `fzf (1)              - a command-line fuzzy finder` and switch its first to space separated 'columns' around.
In this example, we get `(1) fzf`.
We finally remove the parentheses, and pass the result to `man` as its argument.

And just like that we arrive at our desired man-page!

[^filteringman]: The fact that we can either decide to pass in a default argument and thereby pre-filter the list, or simply wade through the whole possibility space of all man-pages is actually quite useful for us. Implementing such a pre-filter argument is not hard for many programs and is generally useful when building something for `fzf`.

## Fuzzy package management

Alright, we now have some of the basics out of the way.
To be able to fuzzily search packages is not much more advanced,
but I want to have a preview with the package information displayed as well --
so we will now get into using the `fzf`'s preview window.

`alias fzfyay="yay -Slq | fzf -m --preview 'yay -Si {1}' | xargs -ro yay -S"`

Once again, the `yay -Slq` will feed all packages in the repositories to `fzf` through `stdin`.
[^yayslq]

Now `fzf` itself gets a bit more advanced.
First off, we use `-m` to allow the user to select multiple entries which will then _all_ be passed on.
Then, we instruct `fzf` to create a preview windows, which it fills with the package information for whatever entry we have currently selected.
It will re-run this command to populate the preview window whenever our selected entry changes.

Lastly, we take everything that `fzf` spits out (remember, it could be multiple arguments),
and send it to `yay -S` again, to begin their installation.
I won't go too deep into an explanation of `xargs` and its options,
but suffice to say that this combination allows us to use `yay` interactively,
and will not run anything if we did not select anything with `fzf`.

Done!

<video src="a-fzf-workflow/fzf-yay.webm" type="video/webm" loop controls autoplay>
</video>

As a bonus, we can also fuzzy-fy the removal of existing packages with the following commands:

`alias fzfyayrns="yay -Qeq | fzf -m --preview 'yay -Qi {1}' | xargs -ro yay -Rns"`

It's not too different from installation,
but uses your locally installed packages as listing and information sources instead.
Of course, similar results can also be achieved with `pacman` if you are not using `yay` --
the syntax is basically congruent between the two programs (thanks `yay` developers!)

[^yayslq]: `-Slq` means `sync`, i.e. get information from the repos, `list` list all available packges, `quiet` hide extraneous information and only show the package names.

## Fuzzy shell completion

Fuzzy shell completion is quite a bit more involved than our basic examples so far.
In fact, while basic completion is possible to achieve relatively quickly,
I would suggest you do the same thing as I am currently:
use aloxaf's impressive [`fzf-tab`](https://github.com/Aloxaf/fzf-tab) plugin!
Be aware that the following will only work for the `zsh` shell.

You install it and source its main file from wherever you installed it:
`source /install/location/fzf-tab.plugin.zsh`, and you are done.

Read the accompanying instructions carefully, and you have a basic working tab completion with `fzf`.
If you look into the configuration section, there are some examples for adding additional, really useful completions.
For example, to get a preview of the various processes running on your system when invoking `kill`,
you can use the:

```zsh
# give a preview of commandline arguments when completing `kill`
zstyle ':completion:*:*:*:*:processes' command "ps -u $USER -o pid,user,comm,cmd -w -w"
zstyle ':fzf-tab:complete:kill:argument-rest' extra-opts --preview=$extract'ps --pid=$in[(w)1] -o cmd --no-headers -w -w' --preview-window=down:3:wrap
```

This arcane snippet of code is `zsh-completion` code, and will invoke the `fzf-tab` program as a completer.
If you ignore the `zsh`-specific configurations above,
you can see that it boils down to basically invoking the preview window again.
Only this time its population is quite a bit more involved, using a few `zsh`-specific possibilities to end up with something like the following:

<video src="a-fzf-workflow/zsh-tab-kill.webm" type="video/webm" loop controls autoplay>
</video>
