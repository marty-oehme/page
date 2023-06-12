---
layout: ../../../layouts/BlogPostLayout.astro
title: "Using xclip or xsel to interact with the clipboard"
description: "Comparison of xclip and xsel"
pubDate: "2021-02-23T09:30:36+0200"
weight: 10
tags: ["commandline"]
image:
  url: "https://docs.astro.build/assets/full-logo-light.png"
  alt: "The full astro logo"
---

## Two programs, one purpose

Both `xclip` and `xsel` serve practically the same purpose ---
they let move write stuff to and read stuff from the X server 'clipboard' in a scripted manner through your shell.

Both programs can access and manipulate all three of UNIX's most often used paste boards:
primary selection, secondary selection, and the clipboard.
And both work on roughly the same premise, required by the X server inter-process handling of copy-paste,
of spawning a background process which keeps the clipped information
and exiting when new information fills the buffer.

But which one should you use?
In the overwhelming majority of cases there should not be any difference between the two ---
pick the one you're more comfortable with, or your distro ships with,
and stick with that one.

There are some small considerations, and specific corner-cases, however,
which can make one program more appealing over the other to you.

Syntax-wise, `xsel` is generally a bit quicker to use ad-hoc since its basic options are more terse,
while `xclip`'s options make sense for its purpose, and allow some more manipulation of clipping formats.

Generally, there are four considerations between the programs:

- syntax terseness
- content clearing options
- data formats accepted
- non-interactive behavior (i.e. scriptability)

## Syntax terseness

First off, some basic syntax:

### Copying something to the primary buffer

`echo hi | xclip -i -selection primary` _or_, since it is the default behavior: `echo hi | xclip`

`echo hi | xsel -i -p`, or: `echo hi | xsel`, since primary selection is also its default buffer.

### Copying to clipboard

`echo clip | xclip -i -selection clipboard`, or `echo clip | xclip -se c`.

The abbreviated form is possible since `xclip` options are accepted as soon as they are unambiguous
(so, `xclip -s` is not possible since it has both `-selection` and `-silent` options),
and the selection argument only needs a first letter to be valid (`p`, `s`, or `c`).

`echo clip | xsel -i --clipboard`, or `echo clip | xsel -b`

`xsel` generally keeps to the GNU convention of having long-form options after two dashes
and single-letter versions with one dash.

### Outputting clipboard contents

`xclip -selection clipboard -out | less`, or `xclip -se c -o | less`

`xsel --clipboard --output`, or `xsel -bo`

### Clearing clipboard contents

`echo "" | xclip -se c` --- `xclip` does not have an explicit option to clear, but has to be 'filled' with emptiness to overwrite the buffer.

`xsel --clipboard --clear`, or `xsel -bc`

### Automatically clearing clipboard contents

The two programs have different ideas of automation ---
`xclip` works with a _number of clipboard invocations_,
while `xsel` works with a simple timer.

`echo gone | xclip -selection clipboard -loops 3`, or `echo gone | xclip -se c -l 3`,
will ensure that after 3 pastes `xclip` exits and thus effectively removes the contents it contains from being pasted.

`echo gone | xsel --clipboard ----selectionTimeout 3000`, or `echo gone | xsel -bt 3000`,
will keep the selection in the clipboard for 3 seconds (3000 milliseconds) and then exit `xsel`, same as `xclip`.

One thing to consider is that, while the `xclip` invocation count works perfectly as is,
with some clipboard managers (in my case [`greenclip`](https://github.com/erebe/greenclip)) the buffers are continually read.
That means, it invokes the buffer and `xclip` counts this as one of its loops.
So, using a clipboard manager, `xsel` offers the more reliable method of clearing here,
even if the invocations idea is very nifty
(e.g. clear passwords from clipboard after first paste).

### File redirection

While both work with an invocation of `cat`:

`cat myfile.txt | xclip`

`cat myfile.txt | xsel`

`xclip` can additionally read files directly (`xclip myfile.txt`),
which `xsel` can not do.
Here, however, you can just use file redirection to avoid the `cat`-call as well:
`xsel -b < myfile.txt`

Similarly, you can of course redirect the outputs to a file:

`xsel -bo > myfile.txt`

`xclip -o -se c > myfile.txt`

## Data formats

One area where `xclip` generally shines is dealing with different data formats.
It can extract binary data from the clipboard,
making it possible to store screenshots in there, for example:

`maim -s | xclip -se c -t image/png`

Sometimes, the target does not have to be specified,
though this can be tricky and sometimes does not recognize the correct format.

To output a list of all available targets, you can invoke `xclip -o -t TARGETS`.
[^newcommand]

[^newcommand]: Apparently, this option may change in upcoming `xclip` versions. If `xclip -version` is 0.13 or lower, the above command should work. Otherwise perhaps `xclip -T` is the intended operation, see [here](https://github.com/astrand/xclip/issues/79#issuecomment-721417730)

`xsel`, as far as I am aware, simply does not deal with binary formats,
and has no option to set a target format or anything of the sort.

## Non-interactive behaviors

There are some differences between the two programs when invoked in scripts or non-interactive shell sessions which can lead to some headaches if not known about.

Generally, `xsel` should be preferred in many non-interactive contexts over `xclip`.

First of all, `xclip` does not close its `stdout` when reading from another copy buffer.
That is the reason for e.g. the Arch Wiki [recommending](https://wiki.archlinux.org/index.php/Tmux#X_clipboard_integration) to prefer `xsel` over `xclip` when trying to integrate and scrape the `tmux` clipboard.

Secondly, there is a behavior in `xclip` which does not let it correctly detach from
non-interactive bash sessions, as [documented here](https://unix.stackexchange.com/questions/316715/xclip-works-differently-in-interactive-and-non-interactive-shells).
`xclip` does not completely fork off, or detach from the parent terminal session,
and thus exits when its parent session exits.

This behavior can be fatal (and very frustrating to debug) when trying to invoke `xclip` in shell scripts which work with sub-shells
(e.g. `$(echo process substitution | xclip)`).
While `xsel` has a specific option to keep itself attached to a terminal (`--nodetach, -n`) if desired,
`xclip` can not provide the opposite.

## Conclusion

Which one to use should largely remain a question of personal preference,
especially regarding their syntax usage for day-to-day operations,
since those really do diverge between the programs.

Personally, I am not a fan of `xclip`'s long options being behind the same single dash as its short options,
as well as no single-letter option existing for some of its most frequent operations (e.g. selecting clipboard).
In general, I feel like the way options are structure in `xsel` makes more sense to me ---
they are separated in input, output, and actions, and can be respectively combined with a selection to work on ---
while `xclip` seems a bit less structured.

That being said,
the data formats of `xclip` make it basically a necessity to use when you want to copy rich-content to and from the clipboard.

For scripts, and also the reason I wrote this post in the first place,
I might switch to using `xsel` in the future,
since the `xclip` behavior of closing with the parent terminal makes things really hard to accomplish in some more advanced scripts.

Lastly, I think I prefer `xsel`'s method of emptying its contents after a specified amount of time.
It's predictable,
is easy to inform the user about,
and does not interfere with any running clipboard managers or similar.
Some people like to create a wrapper (called e.g. [`copy`](https://github.com/kyazdani42/dotfiles/blob/master/bin/copy)) which invokes one of the two programs,
depending on availability, clipping needs, and personal preference.
[^wrapper]

[^wrapper]: I even wrote one for myself, but did so at the beginning of my time in the terminal and it shows in the [code](https://gitlab.com/marty-oehme/dotfiles/-/blob/master/X/.local/bin/clip). Additionally, I don't think I ever really got into the habit of actually _using_ the wrapper and often even forget I created it. For people who often switch between different machines, containing different programs, such a thing might be of great use, however.

But on the whole, both programs are wonderful options for interacting with the X server's clipboards and paste selections,
and both authors deserve my full gratitude for making my life easier basically every single day I am working on my PC ---
from automating password entries,
quickly copying long file names and paths,
to sharing URLs ---
they massively ease the headaches of getting data from one application into another on any X server installation.

## Resources

Some more resources which go into detail on the two programs:

- [https://wiki.archlinux.org/index.php/Clipboard](https://wiki.archlinux.org/index.php/Clipboard)
- [https://fernandobasso.dev/shell/copy-paste-from-command-line-xclip-xsel-clipboard.html](https://fernandobasso.dev/shell/copy-paste-from-command-line-xclip-xsel-clipboard.html)
- [https://askubuntu.com/questions/705620/xclip-vs-xsel](https://askubuntu.com/questions/705620/xclip-vs-xsel)
- [https://madebynathan.com/2011/10/04/a-nicer-way-to-use-xclip/](https://madebynathan.com/2011/10/04/a-nicer-way-to-use-xclip/)
- [https://github.com/mawww/kakoune/issues/1847](https://github.com/mawww/kakoune/issues/1847)
