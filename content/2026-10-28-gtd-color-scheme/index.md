---
title: Taskwarrior color ramps and attributes
description: |
  A semantic base16 color scheme
pubDate: 2026-10-29T08:36:19
topics:
  - task-management
series:
  id: taskwarrior-gtd
  order: 4.6
tags:
  - taskwarrior
weight: 10
---

I change my terminal colors a lot.
Using [tinty](https://github.com/tinted-theming/tinty) and the
[base16](https://github.com/tinted-theming/home/blob/main/styling.md) spec, I
have a wide variety of colorschemes to choose from at any point in time (around
300 when I just checked).
Now, while I don't make use of all of them at every point in time, I do need my
cli tools to, at the very least, work equally well on both light and dark color
schemes, and a wide variety of them in the ideal case.

When your TaskWarrior colors start to clash with everything, or worse, start
become unreadable against the terminal background, you need to adapt them before
this trigger negatively impacts your wider system.

Taskwarrior's stock themes paint blocked and blocking tasks with bright
backgrounds, which looked perfectly fine in Solarized and turned genuinely
unreadable in Gruvbox.
So I decided to build a scheme that would survive any base16 theme I could throw
at it.

## The constraint about base16

A base16 scheme only defines sixteen colors, but your terminal's ANSI palette
also wants sixteen slots.
The standard tinted-theming template fills the gap by reusing each accent for both its normal
and bright slot:

```text
ANSI 1  red       base08     ANSI 9  bright red    base08
ANSI 2  green     base0B     ANSI 10 bright green  base0B
ANSI 3  yellow    base0A     ANSI 11 bright yellow base0A
```

So `color3` and `color11` are literally the same color.
The same holds for every accent pair -- `1/9`, `2/10`, `4/12`, `5/13`, `6/14`.
The only slots that actually differ are the neutrals, because base16 reserves
separate dark and light neutral values for them.
In practice this means I have six usable accent hues, a couple of neutrals, and
the text attributes (italics, underlines, and so on).
Nothing more. Any design that leans on "bright" variants is leaning on
a color that, in practice, does not exist.[^base24]

[^base24]: I suppose 'that does exist, but that is a duplicate' would be more precise wording here, but it gets the point across. By the way, to fix this is a major reason that the newer `base24` fork exists. If you are a `base16` user and wish for a few more usable variants, take a look
at this.

## Two ramps, separated by temperature

With only six hues, we need to be sensible about devoting them to transferring
information at a glance.
Ultimately, I will generally come back to two axes that are important for me to
read at a glance from a productivity suite:
which items are urgent?
And which items are important.
Other information may be important at certain points and for specific reports,
but these are the two axes I actually _always_ care about.

Urgency is the primary one, and it gets the warm colors -- the generally
familiar traffic-light progression:

```ini
color.due=color2          # approaching - green
color.due.today=color3    # today - yellow
color.overdue=inverse color1   # missed - red, inverted
```

An overdue task should instantly be an eye-catcher, at any point in time.
If this item exists, something went wrong along the way and we need urgent
triage.
So not only does it turn red, but it inverts the foreground and background
colors, to be fully in your face when scanning.

Importance is the second axis, and it takes the cool colors, deliberately
opposite the warm urgency ramp so the two never blur together:

```ini
color.uda.priority.H=color5    # high - magenta
color.uda.priority.M=color4    # medium - blue
color.uda.priority.L=          # low - nothing
```

That empty low-priority line is not an oversight.
In my priority model, `L` sits _below_ having no priority at all -- an `L` task
is one I have decided I will get around to eventually and am fine forgetting
about.
It does not deserve a color, though I was playing around with having it subdued
for a bit.
In the end, freeing that hue was worth more than spending it.

Recurring tasks got the same (non-)treatment and no color ownership, but for a
different reason:
every recurring task in my list has a due date, and urgency outranks recurring
in the precedence list, so coloring them will always be invisible work.
I left it blank.

## Attributes are the third dimension

Once the hues run out, the remaining states are carried by text attributes
instead.
`+next` gets bold, active tasks get underlined, and blocking tasks get inverted:

```ini
rule.color.merge=1
color.tag.next=bold
color.active=underline
color.blocking=inverse
```

There is one catch, and it is the whole reason this works:
`rule.color.merge` must stay at its default of `1`.

With merging on, these attribute-only rules _add_ to whatever ramp color the
task already has -- a high-priority next action is bold magenta, not plain bold.
An active task due today is underlined but still yellow while I work on it.

Turn merging off and each attribute rule replaces the color beneath it,
flattening the whole scheme.
I have left a comment in the file so future me does not "clean it up" and
quietly break everything.

## The precedence that makes "today" work

Taskwarrior's `+OVERDUE` virtual tag is time-based, not date-based.
A task due today at 18:00 is considered overdue at 18:01 -- the _clock_ passed,
even though the day did not.

However, I generally work at a date-based level for tasks:
I know that I need to have something done by this-and-that day, but the hour
doesn't really matter.

This means all my tasks, by default, are due at midnight (00:00:00) of the day
already.
I think there is an option which can be changed in TaskWarrior to default to
another hour in the day if none is given, but we can also distinguish directly
in the color scheme.

Colors in the scheme have a certain precedence - which can be given explicitly.
Because `overdue` outranked `due.today` in the color precedence list, every task
due today would flip red the moment its time slipped past.
That feels wrong and negates the idea of 'due soon', 'due today', 'due past' in
my color system.
I reordered the precedence so `due.today` wins:

```ini
rule.precedence.color=...,due.today,scheduled,overdue,due,...
```

This urgency ramp gives another nice side effect:
a task due soon is green, a task due today is yellow and inverted and a task
already overdue is red and inverted, demanding attention.
However, a task that is specifically set to be due _later_ today (e.g. in the
afternoon) is only yellowed without the inversion, so you can still have
fine-grained separation if you use times for your due dates.

## Blocked, and blocking

Two more states lean on the same neutral, but in opposite directions.
A task that is _blocked_ -- waiting on something else before it can move -- gets
a muted foreground, so it recedes from the list:

```ini
color.blocked=color8
```

A task that is _blocking_ others is the mirror case:
nothing else on that project can move until it does.
It should not shout, but it should be visible, so it takes the same neutral as a
background while its foreground is left alone:

```ini
color.blocking=on color8
```

I landed on a background only after trying the obvious alternatives.
`underline` turned out louder than `inverse` and collides with active tasks;
`inverse` was too loud for what is, mechanically, an ordinary actionable task.
Taskwarrior has no `dim` attribute, so a neutral foreground or background is the
quietest signal on offer.

In base16 the neutrals are defined by role rather than hue:
`color0` is the default background, `color7` the default foreground, and
`color8` (base03) the comments/line-highlight grey that sits one step off the
background.
Accent colours can be any hue at any saturation and drift between themes; the
neutrals do not, which is why this survives a palette change.
And because the rule sets only a background, `rule.color.merge=1` lets a
high-priority blocker keep its priority colour, just washed over the faint grey.

One interaction worth watching:
a blocker that is _also_ overdue stacks this with `color.overdue`, whose
`inverse` swaps foreground and background.
In my case this works - urgency will always trump blocking states for my
considerations, but it may be something to check with some test tasks.

## Verdict

I have run this for a few weeks across Solarized, gruvbox, and a handful of
others, and it has held up without a single tweak.
The trick was to stop asking the palette for colors it does not have, and to let
attributes carry the states that hue cannot.

It is nothing particularly clever that other list systems don't do, but it is
_stable_, and stable is what you actually want when dealing with a long list of
tasks ahead of you.

The full theme lives
[in my dotfiles](https://git.martyoeh.me/Marty/dotfiles/src/commit/18635bea7c4ef07400c1dbb26b83129f39e3bc0b/office/.config/task/colorscheme)
if you want to steal it.

## Resources

- [Tinted-theming base16 styling spec](https://github.com/tinted-theming/home/blob/main/styling.md)
- [base24](https://github.com/tinted-theming/base24/)
