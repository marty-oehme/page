---
title: Improve Neomutt attachment handling
description: Using your favorite file manager with neomutt
pubDate: 2025-09-24T08:34:08
tags:
  - commandline
  - opensource
weight: 10
---

The terminal mail client [Neomutt](https://neomutt.org) comes with a built-in file manager for you
to use. It is used when saving files, and when attaching files.

However, it is also very basic: you can manually input a path on the command area,
or hit `?` to open a file selection menu which only allows you to go up and down by single items,
does not allow search or bookmarking, and always starts you back from the current Neomutt directory.

I am slowly migrating away from using Neomutt but, for the time being,
I have written a small script which allows you to instead use your favorite file manager for any
attachment work (both attaching new files to an e-mail and saving existing attachments to your files),
and though I would share it here.

## Why this script

When first deciding that I would really like to use my own file manager for this workflow I looked
around for other open snippets which I could use and found a few which make use of the external
command feature of Neomutt.

Unfortunately, most of them relied on creating external files with hard-coded names in your cache
directory which would then linger around since they could not be deleted by the script itself. This
means that a) all your last attachments are leaked there and never deleted and, b) this can lead to
unintended attachments when running multiple Neomutt sessions at once, or through other
circumstances.

After some deliberation I believe the approach of this script is an improvement: it directly picks
up the chosen attachment files from standard out, and formats it in a way which Neomutt understands
as a command.

```bash
_file_picker() {
    if command -v vifm >/dev/null 2>&1; then
        vifm --choose-files - "$@"
    elif command -v fzf >/dev/null 2>&1; then
        fzf -m --prompt='Choose one/multiple file(s) to attach >' "$@"
    fi
}
attachfile() {
    _file_picker "$@" |
        while IFS=$'\n' read -r attachment; do
            printf "push '<attach-file>%s<enter>'\n" "$attachment"
        done
}
```

The basic magic is done with these two functions: the file picker lets the user set up their file
manager's 'picking mode' and use it to select files, which is then formatted as an `attachment`
command which is pushed back to Neomutt.

The result is quite flexible with multiple attachments possible at once, and no left-over temporary
files polluting the home directory.

Likewise we have an equivalent `_dir_picker()` and `savetodir()` function which allow selection of a
directory and pushing this to Neomutt as a `save-entry` command, respectively.
The only two differences for these functions are that, first, we use the 'directory selection' mode if
supported by your file manager and, second, we only allow you to select exactly _one_ directory,
since Neomutt does not support saving a single attachment to multiple directories.

Perhaps there is a way to extend the script to allow saving multiple attachments at once, for which
selecting several directories may come in handy but for now this is not supported functionality.

## The script

Here is the full script, you can for now also find it as a
[gist](https://gist.github.com/marty-oehme/5fac4e9a28081fc8a8297b2ebc4a4ec7) on GitHub.
Save it to any directory on your PATH (I called it `neomutt-filer`) and then add the following key
binds to your Neomutt configuration:

```neomuttrc
macro compose A '<enter-command>source "neomutt-filer attach"|<enter>' "Attach with file manager"
macro attach S '<enter-command>source "neomutt-filer saveto"|<enter>' "Save attachment to dir"
```

Of course, change the actual bind to your liking. Take care that the `|`-pipe character is
necessary, so be careful not to forget it.

The full script is just some quality of life functions around the previously explained functions:

```bash
#!/usr/bin/env bash
# A simple utility script for neomutt to use your favorite cli
# file manager to work with files in neomutt.
# Can add attachments to emails or save attachments in a chosen directory.
_file_picker() {
    if command -v vifm >/dev/null 2>&1; then
        vifm --choose-files - "$@"
    elif command -v fzf >/dev/null 2>&1; then
        fzf -m --prompt='Choose one/multiple file(s) to attach >' "$@"
    fi
}
_dir_picker() {
    if command -v vifm >/dev/null 2>&1; then
        vifm --choose-dir - --on-choose exit "$@"
    elif command -v fzf >/dev/null 2>&1; then
        find "$@" -type d -print | fzf --prompt='Choose dir >'
    fi
}

attachfile() {
    _file_picker "$@" |
        while IFS=$'\n' read -r attachment; do
            printf "push '<attach-file>%s<enter>'\n" "$attachment"
        done
}

savetodir() {
    _dir_picker "$@" | xargs printf "push '<save-entry>%s<enter>y<enter>'\n"
}

_usage() {
    echo """
Usage: neomutt-filer <subcommand> [options...]
Subcommands:
    attach      Pick files to attach
    saveto      Pick a directory to save into
    """
}

case "${1:-}" in
attach)
    shift
    attachfile "$@"
    ;;
saveto)
    shift
    savetodir "$@"
    ;;
-h | --help | *) _usage ;;
esac
```

The switch case exists just to create the two command invocations as sub-commands, and to print a
small usage info box when the program is invoked in any other way.

That is all that should be needed for you to work with your usual favorite file manager with
Neomutt,
at least for file attachments.
Perhaps it could be extended for other file operations in Neomutt but I have personally never needed
it.
Let me know if you extend the script, and we can integrate it!

Additionally, let me know if you made it work with other file managers.
I only ever use vifm, and sometimes fzf as a picker, so I made sure it works well with either of those,
but do let me know how you get on with others such as ranger, nnn, yazi, xplr or others!
