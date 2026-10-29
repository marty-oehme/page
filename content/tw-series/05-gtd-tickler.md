---
title: Forgetting on purpose
description: |
  Trusting taskwarrior to hold things so I don't have to
pubDate: 2026-11-03T21:34:12
topics:
  - task-management
tags:
  - taskwarrior
weight: 10
---

The last two posts built a way to capture everything, and a way to find it again
by context.
Both of those are, in principle, about 'not losing' things.
There is a third kind of trust that matters just as much, and it took me longer
to appreciate:
trusting the system to bring something back at the right time, and to keep it
out of my face until then.
Getting Things Done has a mechanism for this, it calls it the tickler.

## The concept

Some things you cannot act on today, but you also cannot throw away.
The contract renewal that is not due for eight months; the answer you are still
waiting on from someone else; the idea that is right -- but maybe not yet.

GTD's answer to this is the tickler file:
a folder for each day, where you drop a note to your future self.
When the day comes, the note resurfaces.
The point is not to procrastinate.
It is to make a decision once ('not now'), and then stop carrying it around.

While the physical version is a stack of folders; the principle is that you can
forget on purpose, because you have arranged for a future reminder, and that
translates very well into the digital realm.

The tickler also has a close relative called Waiting For:
things where you are not the bottleneck, someone else is.
A reply, a delivery, an approval.
Different in theory, but it has the same job, which is to hold the item and
bring it back.

## What that means for taskwarrior

Taskwarrior has three date fields, and they are not the same thing:

- `due` is a deadline:
  It _has_ to be done by then.
- `scheduled` is a plan:
  It is the day I _intend_ to work on it.
- `wait` is just a curtain:
  Do _not show_ me this until then.

The third one is the tickler.
A task with a future `wait` date vanishes from the normal reports.
But it is not gone and it is not hidden from search; it simply does not appear
in `list` or `next` until the date arrives, at which point it walks back in on
its own.[^waithidden]

[^waithidden]: While tasks carry the information, it is actually the reports themselves which
carry this decision.
Take a look at the post in this series on creating the inbox report and on
contexts to see how Taskwarrior uses contextual information from tags to build
views.
The `waiting` report introduced further down for example decides to _only_
display items with this information instead.

I have used a few reminder systems over the years, and to me this is the
'quietest' one.
No folders to file, no separate app, and, crucially, nothing to continuously
remember.
The decision of when to look at it was made once, when I set the date.

Taskwarrior also folds Waiting For into the same field, which I like more than I
expected.
A waiting-for item is just a task with a `wait` date and an unstated "and then I
check on it".
The distinction between "I will do this later" and "someone else will do this"
lives in the description, not in a separate list.

Some examples, to make it concrete:

```text
wait: 2026-10-31  due: 2026-11-26  Check Black Friday deals
wait: 2027-02-01  due: 2027-02-15  Domain renews or gets cancelled
wait: 2026-09-30                   Wait for app to move out of unstable channel
wait: 2026-09-19                   Wait for answer to upstream PR #1312
```

The first two are ticklers, resurfacing ahead of an event or renewal date.
The last two are waiting-for:
one is a project dependency, one is a person.
All four are out of my head until they are relevant again.

## The setup

Setting one is a single field:

```sh
task add "Domain renews or gets cancelled" wait:2027-02-01 due:2027-02-15
```

To see everything currently deferred, the `waiting` report does the filtering
for me:

```sh
task waiting
```

And the trick I keep reaching for is applying the same idea to a recurring task.
My weekly review is due on Friday, but I do not want it showing up all week, so
it waits until Thursday:

```sh
task add "Weekly review" recur:weekly due:friday wait:thursday
```

Which means the review only appears the day before it is due, when I can
actually do something about it.
The same pattern works for anything recurring.
A monthly bill does not need to live on the list for thirty days; it usually
just needs to show up a few days before it matters.

## The ritual

A tickler is only _trustworthy_ if it reliably resurfaces, and only _useful_ if
the dates stay honest throughout.
Both of those will be handled in one place:
the weekly review (step four in your Inbox, Clarify, Organize, Review pipeline).

```sh
task waiting
```

For each item, one question:
what am I waiting on, and did I push it forward?
A wait date that has passed with no action means the task was a lie and needs a
new date or a decision.
A waiting-for item that has been waiting too long may need a nudge, or it needs
to be dropped, because a thing you will never chase is not a task, it is a wish.

This process is nothing dramatic:
It is one command and a few seconds.
But it is the step that lets you trust the curtain, and that trust is the whole
reason the mechanism works.

## Scheduled is not a tickler

Taskwarrior has a third date field that looks like it ought to do the tickler's
job, but it does not.
`scheduled` is the day you _plan_ to work on something.
It is a nudge, not a curtain.

The differences that matter:

- Visibility: A `scheduled` task stays in my list.
  Before its date it sits lower down on the urgency, and as the date approaches
  it climbs, but it never leaves.
  A `wait` task disappears entirely until its date arrives.
- Intent: `scheduled` answers "when do I intend to do this".
  It is a soft plan, and the task stays on my radar the whole time.
  `wait` answers "when is this worth looking at".
  Before that, it is not on the radar at all.
- State: A waited task is in the `waiting` state, which the `waiting` report
  and the `+WAITING` tag both key off.
  A scheduled task is an ordinary pending task that happens to carry a date.

Which is why `scheduled` does not fit a tickler.
The whole point of a tickler is to stop carrying the thing in the main list for
a while.
If it stays in the list, even at the bottom, I am still aware of it, and that
awareness is the part I wanted to hand off.
A scheduled task six months out is a low hum in the background, while a waited
task is just silence until it matters.

So I use both, for different jobs.
`scheduled` means "I will sit down with this on Thursday", and it should stay
visible, because I need to plan my week around it.
`wait` means "do not show me this until the renewal is close", where seeing it
early is nothing but noise.

Setting both to the same day is not wrong, just redundant:
the wait decides when the task reappears, and the scheduled date only starts
doing anything on that same day.

## Waiting-for can be a tickler

Personally, I don't often use the Waiting-For list, though it may of course be
very useful to you.

The simplest way to integrate this, yet differentiate it from the tickler above
is to add both a `waiting` state to the affected tasks _and_ a descriptive tag
you will always use to describe things you are waiting for.
Some people may use `+delegate` or `+wf` (waiting-for) for its clarity or
conciseness.
As I said, I don't use too many of them, so I like to give tasks the `+followup`
tag as the wording already includes the action _I_ will have to take to move it
forward.

```sh
task add +followup wait:2026-09-19 Wait for answer to upstream PR #1312
```

Taskwarrior's single `wait` field can cover the tickler and the delegation both,
and one field also means only one place to look for any tasks with the `waiting`
attribute.
If I then want to further restrict my view to waiting-for tasks, I can filter
the report further via the tag.

```sh
task +followup waiting
```

The drawback here of course is that you define relatively precise points in time
at which your list will surface the various delegations you have running again
-- this may not come exactly at the point in time at which they are most useful
to you.
For me, this can actually be a positive, since it allows me to estimate a
completion time-frame.
I can then make a conscious note if something happened either faster than
estimated or is moving ahead slower than anticipated, and react accordingly.
Worst-case, it will have to be waited-for once again, if I can't do anything
else about it on my side.

If you require very different workflows for tasks that are on the tickler or
follow-ups then perhaps you need to differentiate more between the two.
One idea would be to add a new report which is called `waitingfor` and surfaces
_just_ the tasks with the `+followup` tag -- even if they are technically still
`waiting` and not `pending` -- and sort them by their waiting-for date.

## Resources

- Getting Things Done, David Allen, for the tickler file itself
- The [taskwarrior `wait` documentation](https://taskwarrior.org/docs/)

That's all for today.
play around with the three timing fields `scheduled`, `wait` and `due` and you
will see how much power clear differentiation between them gives you.
Thank you for reading.
