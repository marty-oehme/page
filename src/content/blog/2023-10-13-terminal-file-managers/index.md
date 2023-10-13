---
title: "Terminal file managers"
description: "Why and when to use them?"
pubDate: "2023-10-13T09:40:49+02:00"
weight: 10
tags:
  - commandline
  - opensource
---

Why use terminal file managers?
It is a question I ran across on a Lemmy [Linux community](https://programming.dev/post/4260408),
regarding TUI file managers such as
[vifm](https://vifm.info/),
[lf](https://github.com/gokcehan/lf),
[nnn](https://github.com/jarun/nnn),
[ranger](https://ranger.github.io/),
[mc](http://midnight-commander.org/),
[xplr](https://xplr.dev)
and more.

A quickly ran through the (65) answers at the time because I was also interested in why other people use it.
I collected the overall types of answers in the table below, which should clarify the reasons a little.[^small-n]

[^small-n]: although with such a group of respondents it is obviously nowhere near representative of anything

## Why others use them

| times mentioned | reason              |
| ---             | ---                 |
| 21              | easier              |
| 13              | more efficient      |
| 12              | faster              |
| 5               | for ssh             |
| 5               | tool integration    |
| 4               | as inbetween        |
| 3               | as gui-replacement  |
| 2               | for file previews   |
| 1               | advanced operations |

The three reasons given most often were file managers are easier, more efficient and faster than working either on the cli or through the GUI,
with being easier nearly being as weighted as both efficiency and speed together.

Most of the time, the ease of use was mentioned to come from not having to remember individual cli commands,
as well as having a visual aid for operations (through the miller view or pane-like view most programs give).
These arguments are further supported by the reasons given for having quick access to file previews
(and image previews) as well.
If coming from a cli, having the ability to quickly look 'into' text files or preview an image thumbnail while scrolling through the file structure is very nice,
while if coming from a GUI the speed at which everything happens is a big advantage.[^speed]

[^speed]: Speed to be understood both from an input perspective, everything taking place through keyboard actions and shortcuts usually, and programmatically since in effect it is still just rendering text on the terminal - a process which is lightning fast on most of today's machines.

Some answers explicitly highlighted the 'in-between' nature of the programs for quick file actions which do not need a GUI.
An interesting view is that of terminal file managers finding their place also for tasks that are 'in-between' in difficulty and size:
When moving a single file somewhere you can probably do it about as quickly through a TUI and the cli of the `mv` command.
When moving a thousand files, perhaps even conforming to a specific pattern, once again the flexibility of the cli will generally win out in really complex scenarios - it will require a little setup but then run very fast.
But in between, for a dozen files or so, which may *not* follow any particular naming or directory pattern,
terminal file managers may come in the most handy.
One answer also stipulated their use for very advanced operations, which the user then bound to specific keys to be executed quickly,
though I personally do not see too big a difference to invoking a custom script on the cli in those scenarios.

One last thing which surprised me was the use for ssh or remote connections, though perhaps it should not have.
It becomes quite logical when accessing a server and not having access to graphical utilities (or at least no reasonable access),
that TUI file managers become an adequate replacement.
It is an area I am perhaps not thinking of primarily because they fill the same role for me locally,
so I do not feel a strong difference between the two modes of operation.

## Why I use them

Personally, I generally agree with the consensus that they can make life easier and often more efficient,
especially for those in-between file operations.
Restructuring a directory can be much more painless with a TUI if you don't already know exactly where what is supposed to be going.
It is a much more fluid process of interaction with visual feedback than the pre-mapping that sometimes become necessary for cli operations.

Of course, as most other commenters rightly pointed out, this does not invalidate cli utilities.
As a starting point or for really complex operations, as long as they are somehow repetitively patterned, they still trump everything else in utility.

But for me, what the comparisons of calling it easier or more efficient really get across is similar to the reason I use vim for editing:
There is very little friction in between the idea you develop and the movements or commands you have to invoke to get there.
The less there is to take you out of your 'flow'-zone the less context-switching your brain has to do and the more efficiently you can work,
generally speaking.

The advantages of visual aids fall right into that category for me.
In a directory structure I know like my back pocket, say my current small programming project, I don't necessarily need a TUI -
I carry the memorization of the file layout with me.
But in a larger project running over longer time-frames, or in other parts of my actual file structure,
seeing the layout visually, using a single key stroke to enter and exit it and see even more of the structure,
becomes indispensable for quick interactions, even surface-level ones.

Similarly for file contents.
For those files I am currently interacting a lot with,
I don't need terminal file managers.
I *know* what is in there.
But for those files that I use more rarely,
older projects,
or simply directories that do not see regular use,
having a peek into the file while keeping the file structure visible at the same time is amazing.

It is basically offloading the cognitive load of simultaneously visualizing file structure and file contents in my head,
in favor of the computer doing it for me.
Mostly, I like to think of it this way:
When doing data analysis, there are two modes of operation for me.
Either, I know the stuff I want to find out and polish data and create models to show me the exact results I want,
or I am not entirely sure *what* I need yet and am doing exploratory analysis, poking and prodding at the data.

In this analogy, for the former, working through the cli is entirely reasonable.
For the latter, having access to constant visual reinforcement of what my changes affect and where lies what is so valuable.
Same for image previews.
Having them just a key-stroke away makes it much easier for me to reason about what to do next,
without having to invoke an entirely different program or use my mouse.

I can both select image thumbnails to do further operation on them (usually requires GUI file managers or special programs),
and use regex to select a bunch of files for later operations (usually difficult to accomplish in those GUI programs),
or even invoke vim to directly operate on file paths in my natural editing environment with a single keystroke (effectively impossible through GUI).
But the main part that makes TUI file managers so enticing is the lack of friction of moving between one mode of operation and another,
bridging the gap when I am still exploring my needs and possibility space.
