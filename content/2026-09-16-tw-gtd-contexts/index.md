---
title: Context for your tasks
description: |
  Teaching taskwarrior to answer "what can I do right here?"
pubDate: 2026-09-16T11:55:20
tags:
  - taskwarrior
weight: 10
---

Last time I built myself a capture inbox for taskwarrior, everything is going
well -- thoughts go into `tin` faster than I can lose them.

Today I want to tackle a new problem which will inevitably surface soon after:
Everything that is captured lands in one big, relatively undifferentiated, pile.

The pile knows _what_ there is to do.
It has no opinion whatsoever on _where_ or _when_.
Sitting at my desk on a Tuesday morning with twenty minutes until the next event
is a completely different situation from standing in the kitchen on a Saturday
with out any events at all -- but the task list will answer both with the same
wall of tasks.

What is missing is the piece of GTD often dismissed as a rather boring one:
contexts.
I wrote about [contexts and projects](../2021-04-07-tw-contexts) in the -- for
lack of a better term -- context of taskwarrior already a few years back.

Some of the information here will just reiterate what I said there, since the
basic conceptual grounding of contexts does not change.
However, this time we will attach our thinking on contexts directly to the
requirements for taskwarrior views, the relatively new idea of 'read' contexts
and 'write' contexts in taskwarrior, and the importance that _naming_ your
contexts well has.

## What I wanted

My requirements, written down before touching any config, as I did last time:

1. Switching situations must filter the list down to what is actually doable
   there.
2. When my life reshuffles, tasks must not need re-filing.
3. Creating a task while already "in" an area should pre-file itself without me
   thinking about it.
4. Fewer than a handful of contexts, or I will simply never activate any of
   them.

That second one here is the one requirement that signals to use contexts and
everything else follows from taking it seriously.
Let's see why.

## Views, not folders

Let's clear up a conceptual mixup that I've seen (and made myself) in the past
again and again, stated plainly:
_a context is a **view** onto tasks, not a place where tasks live._

Folders have trained all of us into a specific reflex.
A file goes _into_ a folder -- exactly one folder -- and if you put it in the
wrong one, it might as well be effectively lost.

Moving things between folders costs effort, so you accumulate re-filing anxiety,
so you stop filing, and then everything lives on the desktop.
My guess is most abandoned task systems died of folder-think.

The next step taken is often to tag your tasks.
With the one (task) to many (tags) relationship you can have, you remove the
restriction of having them in exactly _one_ folder.
But you are still building metadata directly into the task itself.

A context owns nothing.
It is a saved query -- a named filter over your existing attributes -- and
activating it just asks every report to look through that particular lens.
Changing your context does not change your tasks.
Delete a context and exactly zero tasks are affected.
Additionally, a task can be visible from three contexts at once and nothing
about that is mis-use of the concepts.

Say you have captured "fix the leaking tap".
Which taskwarrior context does it go into?
Realizing that taskwarrior contexts are views and taking that fact to its
logical conclusion exposes this as a trick question.
The task carries multiple attributes, each answering a different question:

- project answers _"which outcome is this moving toward?"_ -- say, a bathroom
  renovation project.
  An outcome has a done-state, and a task belongs to precisely one, so this
  could be in a `project:Bathroom-remodeling`.
- tags answer _"what is this about?"_ -- `+plumbing`, `+house` since it's work
  on your home, and maybe `+shopping` since you may need e.g. washers first
  (although that should really be its own task).
- **context** answers _"under which conditions can I do this?"_ -- at home,
  tools out from the cellar, ideally a Saturday morning without pressure.
  Your `home` context happens to see it.
  So would a hypothetical `weekend` context.

Three orthogonal axes, one small task, zero conflict between them.
The hard edge you should internalize:
project is the outcome axis, a tag is the topic axis, a context is the
conditions axis.
The moment you catch yourself asking _"which context should this task go in?"_,
you have already slipped back into folder-think.

Tasks do not go in contexts.
Instead, contexts _look_ at tasks.

## Building contexts from scratch

Taskwarrior's new context mechanism is two-sided:

```sh
context.home.read=+home or +chore or +garden or +family
context.home.write=+home
```

`.read` is the lens:
while the context is active, every report filters through it.
`.write` is the self-filing half:
create a task while the context is active and those attributes get stamped on
automatically.
More on that in a second.

For the actual seams, I ignored my existing tags entirely at first and asked
where a typical week actually splits.

Be very conservative with your contexts.
GTD recommends no more than 5-8 buckets, I prefer to have even fewer,
essentially distinguishing between household _stuff_, professional _stuff_ and
'personal journey' or 'leisure time' or 'play' _stuff_.
Depending on your life, you may want to focus in on 'family' _stuff_, or
'learning' _stuff_ instead.

```sh
context.home.read=+chore or +garden or +family
context.home.write=+chore

context.work.read=proj:work or +meetings

context.play.read=project.not:work
```

`home` groups by condition-tags; anything about the flat, the garden, or family
logistics becomes visible when you are in domestic mode.
`work` anchors on the professional project tree plus a meeting tag for the
cross-project overhead.[^hierarchy]

[^hierarchy]: Project filters match hierarchically:
anchoring on `proj:work` catches `work.reviews`, `work.onboarding`, and whatever
subprojects come later.
That is what lets the whole professional tree hang off one word.

`play` is the one I went back and forth on, so consider this section more fluid.
The choice is between enumerating hobbies (`+music or +woodworking or
+programming or ...`) and defining the residual:
everything that is _not_ work.
Enumerating stays accurate but every new hobby needs a config edit -- and I know
me (and, by extension, you):
we will not make that edit consistently.
The residual version picks up new interests for free.
The cost is that, by default, chores leak in, because they are non-work too.
If that bothers you, subtract them (`project.not:work and -chore`) and let
chores surface only through `home`.

Now for the payoff!
Activate the context, capture through the inbox from last time:

```sh
task context work
tin prepare slides for quarterly review
# or via normal task command:
task add prepare slides for quarterly review
```

...and the task arrives already filed under `proj:work`.
Without deciding, filing, or folder-anxiety.
The context did it for us.

One habit that's worth building alongside:
`task context none` gets you the whole world back again.
An active context persists until you switch it off,[^persists] and reviewing
your system through a perma-lens is a fine way to forget half your life exists.

[^persists]: Where exactly the active context gets remembered has changed between major
versions and I have not delved into the details -- suffice it to say it survives
restarts, which is usually what you want and can occasionally be a surprise.

Not sure which context you're viewing currently?
Use `task context show` to -- well -- show it.
Additionally, should you ever forget your contexts just remember the `task
context list` command.
It will show you a full list of your defined contexts and their `.read`/`.write`
settings.

## Naming is the whole game

One of the hard things in programming is
[naming things](https://martinfowler.com/bliki/TwoHardThings.html), and this is
no different in general task organization.
It's the part I am least confident giving general guidance for, because naming
is very personal.

But my first attempt at contexts used names inherited from how my data had
historically been tagged, and they never stuck.
Activating them required mental translation (which of my piles did I call that
again?)

What ultimately fixes it will be boring advice:
rename until the name is the phrase already in your head.
Mine got shorter and more honest.

For example, my `play` bucket started as `personal` which was too broad, then
morphed to `hobby` which was okay but I could never remember it when typing it
out, and so `play` was both the shortest and most memorable version for me.
Similar transitions for the `professional` bucket which slowly transformed into
just the shortened `job`.

Usage followed within days.
If your contexts feel like dead weight, I would bet on the names before the
mechanism.

Two anti-recommendations from the same lesson:

Do not create contexts for things that already have dedicated reports -- things
like waiting-for items and inbox live behind their own reports, which are views
you _visit deliberately_, whereas a context follows you around everywhere even
when you engage those views.

And keep the count under a handful.
Three lenses you use will always beat thirteen lenses you avoid.

## Making it accessible via aliases

As always, I love my shell aliases.
Typing `task context work` is generally quick _enough_, but to really engage
that muscle memory I have once again created quick aliases which remove a few
more letters between what I want and what I need to type.

Here they are, kept deliberately simple and additive just like last post's inbox
aliases:

```sh
alias tc="task context"
alias tcn="task context none"
```

Type `tc` to show a list of your current contexts.
`tc work` gets you into the context you require.
And finally, `tcn` will quickly return you to a global view.

## What I did not do

- Per-person agenda contexts.
  The GTD idea of having "everything to discuss with X" is lovely in theory, but
  my people-tags are manageable right now, so ad-hoc queries cover it.
  If you have a constant tagging scheme for people, e.g. `+p.name`, you can
  always get a quick view via manual filtering.
  I can always revisit if this area gets unmanageable.
- Time-of-day or calendar-based contexts.
  Tempting, but adds a fourth attribute axis I do not need yet.
- ~~Hotkey switching.~~ Typing `task context work` is fast enough that right now
  automation felt like polishing a doorknob.
  I may very well change my mind on this.
  UPDATE:
  I have changed my mind, as you can see in the section above.

## The complete setup

```sh
# household mode
context.home.read=+chore or +garden or +family
context.home.write=+chore

# professional mode
context.work.read=proj:work or +meetings

# leisure mode: everything that is not work
context.play.read=project.not:work

# bonus: distraction-free mode
context.focus.read=( +next or priority:H )
```

The bonus `focus` context deserves a mention:
it shows only tagged next-actions and high-priority items, which makes it less
of a _situation_ filter and more of an attitude.
When the wall of tasks gets loud, `task context focus` turns it back into a
short list.
Quick win, which costs very little to add.

## A little bonus terminal magic

If you live in the terminal a lot as I do, your command prompt is basically
always visible.
So one additional nicety is to that I can just have the current taskwarrior
context displayed directly there.

If you run the starship prompt this is relatively easy to achieve as will be detailed in another post.
With other prompts, or even the bare bash/zsh prompt, it will be achievable as
well but you'll have to adapt the given code to those use cases yourself.

## Resources

- [Getting Things Done, David Allen](https://en.wikipedia.org/wiki/Getting_Things_Done)
  -- the contexts chapter is short and conceptually clearer than my quick
  summary above
- [Taskwarrior docs: contexts](https://taskwarrior.org/docs/contexts/) --
  read/write mechanics and examples

Thank you for reading!
