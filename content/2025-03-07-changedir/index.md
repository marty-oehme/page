---
title: How the dirs have changed
description: The cd command and the pwd mental model
pubDate: "2025-03-07T15:14:30"
tags:
  - linux
  - commandline
weight: 10
---

The `cd` change directory command in shells is so basic that I never really thought about its inner workings.
Thing is, it _is_ very basic -- but in ways that are so unix-y I wonder why I never thought of them before.
And while reading about how it works, I also learned a thing or two about improving my bash scripts.

Here's the deal:
When you are in a graphical file manager, it has an intrinsic knowledge of where you _are_ currently,
i.e. where on the filesystem your eye currently are, your considerations lie and your programs are run from.
This is kept in memory somewhere and, depending on the application, kept more open or in a more closed environment.

`cd` has no magic, closed-off knowledge of where you are, and technically it doesn't need to.
To get you to point B in the filesystem, it does not need to know your point A if you only ever deal in absolute paths.
However, to enable `cd` working with relative paths (so, paths changing relative to your point A),
it now needs to know where you are currently pointing nonetheless.

How? Through environment variables, of course.
The program makes use of the `$PWD` (present working directory) variable, just like the `pwd` program.
This variable simply points to whatever directory is under your gaze right now.
How does `cd` actually change directory?
By setting `$PWD` to wherever you 'cd'-ed to!

By implementing this simple single-variable interaction,
`cd` can already provide all of its day-to-day functionality:
It lets your system know what you are looking at, by setting a pointer to a directory in the environment.
Now other applications can make use of this pointer to give you more information about it,
such as the shell printing your current directory on the readline,
or allowing relative programs to be called,
scripts to be sourced and so on.

Under the hood, cd generally calls the `chdir()` function, without forking into a new shell --
doing so would defeat the purpose of `cd` since while the subshell would arrive where we want,
as soon as we exit into our parent shell we would be right back where we started.
That is all that's done, invoking that little function.[^chdir]

[^chdir]: For an entry on the `chdir()` function in the POSIX Programmer's Manual, see [here](https://www.man7.org/linux/man-pages/man3/chdir.3p.html).
For an entry on the `chdir()` system call, see [here](https://www.man7.org/linux/man-pages/man2/chdir.2.html).

But there's a little more to it.
Under POSIX, `cd` also has an understanding of your _last_ working directory.
This is, unsurprisingly, also saved in an environment variable called `$OLDPWD`.
So what actually happens when using the program is that it first moves the `$PWD` content to `$OLDPWD`
and then sets the `$PWD` to point to the absolute path or the result of combining itself with the new relative path.

You may have come across the commands `pushd` and `popd` which allow you to pursue a string of paths on the filesystem and then retread them in a backwards manner --
providing a queue of paths which is extended with each `pushd` and contracted with each `popd`.
Well, this queue called 'directory stack' is the same thing that `cd` ultimately uses and traverses.
The one difference between these two commands is that `cd` _replaces_ the current queue element with its invocation results while `pushd` _appends_ the results.`

I came across this recently when learning that `pushd` and `popd` are actually not part of the POSIX standard,
but only supplied by bash (and other modern shells).
However, equipped with this knowledge it is now possible to emulate their behavior somewhat with `$OLDPWD`.
A fact which `cd` also utilizes when using the `cd -` invocation which goes 'back' one movement within the system.
If you ever wondered why repeated uses of `popd` went further back and back and back while `cd -` always ends up moving back and forth between the current and last directories,
you now also understand why:
`cd -` replaces `$PWD` with `$OLDPWD` while its behavior remains to replace `$OLDPWD` with `$PWD`,
thus immediately creating a closed loop between the two variables.

While the result of movement with this understanding is ultimately the same,
I find it much more freeing to mentally model my 'place' in the file system to be a simple environment variable pointer which I can use and change like any other variable,
instead of a 'location' which I actually occupy in any tangible sense.
Or rather, as tangible as any spatial concept on a digital filesystem,
where even the concept of 'moving' from one place to another seems to be quite an archaic abstraction nowadays.

