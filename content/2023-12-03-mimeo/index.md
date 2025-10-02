---
title: "File opening on Linux"
description: "xdg-open and mimeo"
pubDate: "2023-12-03T07:56:31+01:00"
weight: 10
tags:
  - commandline
  - opensource
---

Easy file opening? Should that not always be the case?
Yes. And no.

Opening files is generally a thing one does not think about too much -
you open something and *generally* the right application will take care of it.

It becomes even less of an issue if you mostly use the OS- or distribution-provided program which takes care of it.
Have a `.odt` or `.docx` files? LibreOffice will take care of it.
Have a `.txt` file? Depending on your distribution, Gedit, Leafpad or the wonderful Kate; if you're on Windows it will undoubtedly be the venerable Notepad; and if you're on the terminal you may use nano, micro or vim.

However, things get a little more murky if you want to open it on something different than what your distribution provides.
If there is only one program you want to use by default it will generally be easy to accomplish.
But what about multiple different in different cases?
Or if you have multiple applications you want to open something in -
say an `.html` file either to display in a browser or to edit in a text editor,
a URL, depending on which page it points to,
or a `.txt` file depending on where you open it from.
Lastly, what if you have a file that has *no* extension?

Windows, as far as I remember, will generally use extensions themselves to determine how to open something.
It is a reasonably clever system - making the computer use essentially the same information the human is given at a glance to determine its contents.[^hiddenext]
But it poses some issues as well.
First and foremost: what if, through error or malice, the actual contents of the file do not correspond to its extension?
Such a system also does not allow opening more arbitrary things such as URLs, or files where the extension type is not known in advance.

[^hiddenext]: Well, theoretically the same. Since Windows *hides* file extensions by default, the human has technically less information to work off than the computer. I realize it makes things seem less 'technical' for those who are individuals intimidated by those things (or more stream-lined, design-friendly, whatever the actual reason may be) but it also makes it more dangerous in my mind and more *difficult* to achieve what you want if you are an even just a bit more advanced user, no? Bad actors can more easily hide unexpected file actions and at some point one *has* to differentiate between a `.txt` and `.md` file, or between a `.odt` and `.docx`, `.jpg` and `.png` or what have you. Or perhaps not, with my bubble blinding me to most people's usage reality of the file system.

## MIME types

Linux instead generally uses what are called [MIME types](https://en.wikipedia.org/wiki/Media_type) to know how to handle files.
I guess you can think of them as little hidden sign posts each file carries *within* itself.
In the background, even on most graphical interfaces, what is actually called to open programs is `xdg-open`.
This is a small programs which detects a file's MIME type[^detectmime] and opens the right program.

[^detectmime]: Technically, it is not `xdg-open` doing the detecting - it just maps desktop files to binaries and then delegates to one of the dozens of desktop environment (DE) specific file openers. Some examples are `kde-open`, `gvfs-open`, `gnome-open`, `mate-open` or `pcmanfm`. If it does not recognize a DE, it will instead delegate the MIME detection to the core utility `xdg-mime` which will be queried (as do most of the other tools above). You can even open `xdg-open` and see it is just a very long shell script.

How does it know the right program?
Usually, if you are on any kind of desktop environment distribution, the defaults will set themselves to the programs provided with the distribution.
They do so through MIME type associations.
So, for example the `text/plain` MIME type might be associated with with the Kate editor.

You can manually override those associations as well.
In graphical interfaces it is usually done through a right-click and some variation of 'Set as default program' button, depending on the file manager or settings of the desktop environment one uses.

On the terminal, you generally accomplish it with the `xdg-mime` application.
Use `xdg-mime query default <mime-type>` to see what application something is connected to by default.
Then use `xdg-mime default <something.desktop> <mime-type>` to change it to some other application if you are not happy with the choice.
Be careful that as far as I know you need to specify `.desktop` files, not paths to actual binaries, since the openers will not work with those.
Each desktop environment has its `.desktop` files somewhere similar, akin to `/usr/share/applications`, which is where you can look for those.

## Mimeo

Personally, I am not too enamored with the `xdg-mime`, `xdg-open` combination.
It works *fine* but is also a little too cumbersome for me and each time I come back to it to seriously use its intricacies or want to make changes I have to learn its combined operations all over again.

I have been using [mimeo](https://xyne.dev/projects/mimeo/) for a while now and it takes a little off my mental workload since.
It is not a huge change, we still associate MIME types with desktop entries for applications, but the workflow of doing so just aligns a little more with my thinking.
Essentially the tool combines the functionality of both the `xdg-mime` association and querying portion and `xdg-open` opening usability portion of the other two applications.
It can also assign URI schemes to applications (which `xdg-mime` can too) or even open files by advanced regular expressions or with individual command line arguments (which `xdg-mime` can not, though I have also not made use of it myself).

Here is how it works, mirroring the approach above:

Get the MIME type of a file with the unsurprising option `mimeo --mimetype <myfile>` (or `mimeo -m` for short).
Set the default application to handle a type with `mimeo --prefer <MIME-type> <desktop file>`.

Don't know the `.desktop` file of a program?
Use `mimeo --app2desk <binary>` (e.g. `mimeo --app2desk nvim`) to find it.

That's all there is to it.
Like I said, it is not a world away from the `xdg` tools but it just feels a bit more tidy to me,
especially being able to quickly query for `.desktop` files from the same interface.

However, we can be better!
If you already know the `.desktop` file you want to use,
do the associating with a single command: `mimeo --prefer <file> <desktop file>`.
It will automatically query the MIME type of the file and associate that.

If you want to check everything went right use `mimeo --mime2desk <MIME-type>` to query the association.

Now you can always open your files with `mimeo <file>` and it should open in your defined application.
Arch Linux provides the `xdg-utils-mimeo` package which will automatically make `xdg-open` use `mimeo` so you don't have to do anything else and it will just work.

## Open

I have instead opted to add an *additional* wrapper on top of `xdg-open`, for two reasons.
First, I want to be able to take my setup and largely have it replicate correctly on other systems -
distributions that are not Arch Linux and that may not have a similar package to the above.
And second, I just hate typing `xdg-open` if I actually want to use it manually from the command line (which I do, surprisingly often).

So what I have done instead is add *another* very simple wrapper script on top of `xdg-open` which simply pushes `mimeo` in front of all the other tools should it find it on the system.
You can find the code below, which I called (perhaps a little uninspired) `open`[^darwin] but which rolls much easier off the typing finger.

[^darwin]: Be careful to rename it to something else on a Darwin (i.e. Apple) system, since they already have their file opener named `open`. But then, if you are on those systems you probably do not need to make use of `mimeo` anyway I suppose.

```sh title="open"
#!/usr/bin/env sh
# file opener using your preferred applications

if type mimeo >/dev/null 2>&1; then
    mimeo "$1"
else xdg-open; then
    xdg-open "$1"
fi
```

That's it for now.
I am happy with the setup and can now open everything I need to very easily without even thinking about which program I use under the hood by simply typing `open my-amazing-file.md`.
Perhaps some day I will find necessity for using some of the tool's advanced opening strategies with regex and personal matching files, but that is not today.
If you want to find out more about those, there are some simple examples in the Arch Linux [wiki](https://wiki.archlinux.org/title/Default%20applications#mimeo) or on the `mimeo` [website](https://xyne.dev/projects/mimeo/).
Happy file opening!
