---
title: Tag hygiene for the task graveyard
description: |
  Fixing +next count for completed tasks with a tiny hook
pubDate: 2026-10-28T10:50:34
topics:
  - task-management
series:
  id: taskwarrior-gtd
  order: 4.5
tags:
  - taskwarrior
weight: 10
---

When I was building a small report which shows every taskwarrior project
together with its current next action for
[figuring out GTD next action status](/blog/2026-09-30-gtd-next-project-actions),
the premise was simple:
Each active project should have exactly one task marked `+next`, the one thing
that moves it forward right now.
This report would then run the numbers and show me any projects if they were
missing a next action, or, on the flip side, had too many next actions
assigned.[^toomany] So I made an initial run to count the numbers and see which
projects needed triage.

[^toomany]: Generally, 'too many' next actions means more than one for me.
However, some people like to have multiple next actions to choose from, and some
even like to tag any _available_ action for a project as next.
I don't think there's a single right answer here, so this can be configured in
the given report script.

The results seemed off.
Over a hundred tasks marked as `+next`, some of which I clearly remember already
having accomplished.
After some investigation, a closer look showed the truth:
only fifteen of those were actually pending.
The other twenty-eight were sitting in the completed pile, but still wearing the
`+next` tag like a jacket they had stopped needing years ago.

## Tags are live properties

The thing to realize first is that tags are live properties:
`+next` specifically means "this is the project's current next action", which
can, by definition, only be a live property of an actionable task.
Similarly, `+inbox` means "this has not been processed yet", which requires a
task to still have a future.

Once a task is completed, it is definitionally neither of those things.
It has no current next action, and it was clearly processed enough to be done.
Yet there they were, twelve completed tasks still tagged `+inbox` and dozens
wearing `+next`.

Conceptually, the fix is very simple:
only live tasks may carry these two tags.
Other tags may function as a historical label (context-clues for what you
recently accomplished, delegated or deleted), but a tag is not, by definition, a
historical label.[^taxonomy]

[^taxonomy]: I suppose if there were more tags in the system, and there may be in yours, it
might be useful to create an overall clear distinction here:
some tags are 'context' tags, those that we generally think of as providing
additional clues as to where, when and how an action can be performed (e.g.
`+home` or `+office` for locations; `+p.alice`, `+p.bob` for people, and so on),
while others are 'live' tags, or 'action' tags, which rather denote the _concept
of the action_.
In other words, these tags help sort the tag within your sorting system _only_.
Once they are no longer required to be sorted, they lose their significance.

The annoying part is that this is completely invisible in normal use.
Reports in taskwarrior filter to pending tasks, so the dead tags never surface.
This is a generally a good thing, because we don't care to see finished tasks
when looking for new ones, but these leftovers start to matter when you count.

And counting matters more than you think, because project-health checks like the
script I was building depended on those counts being honest.
A project that had already finished its next action looked like it still had
one, and a project with a stale `+next` on a completed task looked healthy when
it had nothing actionable at all.

## Forced habit is not a system

The obvious answer is to remember to remove the tags when completing a task.
The honest answer is that I will not remember, and neither will you.

I have spent enough years building systems to know that anything requiring
consistent manual discipline is a system that will quietly stop working on a
busy Friday.

Of course, Taskwarrior has a hook system for exactly this.
An `on-modify` hook fires every time a task changes, receives the task before
and after the change, and can modify the result.

The hook has one 'quirk' which you need to be aware of:
An `on-modify` hook receives _two_ JSON objects on standard input, one per line:
the task as it was before the change, and the task as it will be after.[^protocol]

[^protocol]: If you are wondering why the old task is even sent:
other hooks use the before-and-after pair to detect changes, for example to
start or stop time tracking.
My hook happens to only need the new state.
The pair is part of the protocol regardless, and the unused read is the price of
admission.

The first one, `old`, I do not actually use.
But the script still need to read it and throw it away:

```python
old = json.loads(input_stream.readline().decode("utf-8", errors="replace"))
new = json.loads(input_stream.readline().decode("utf-8", errors="replace"))
```

It is tempting to "simplify" this by deleting the first read.
Do not.
Standard input is a stream, and the only way to reach the second line is to
consume the first.

More importantly, the hook must echo the _new_ task back to taskwarrior.
If you read only one line, you get the old task, echo it back, and taskwarrior
dutifully applies it -- silently undoing the user's modification.
A 'simplification' that reverts every edit you make is not a simplification.
I left the unused `old` read in place with a comment explaining why, so future
me does not come along and 'fix' it.

The actual logic is almost anticlimactic.
When the new status is completed or deleted, drop the two live tags:

```python
if new.get("status") in ("completed", "deleted") and "tags" in new:
    cleaned = [t for t in new["tags"] if t not in ("next", "inbox")]
    if cleaned != new["tags"]:
        new["tags"] = cleaned

print(json.dumps(new))
```

## Why I check the new state, not the transition

There is a design decision buried in those three lines.
The hook strips based on the new status alone, not on whether the status
actually changed.
That means may also clean up tasks that were already completed years ago, the
moment anything touches them.

If I had gated on the transition from pending to completed, the old corpses with
stale tags would stay as they were forever, since nothing changes them again.
Checking the new state means the first edit to any dead task quietly sweeps its
graveyard clean, which is a quick win.

At the same time, you won't want to wait for this to happen organically and
still have the wrong counts for your reports.
Instead, `t status:completed mod -next -inbox` will quickly sweep through _all_
your completed tasks and remove the tags in one action.

## What it fixed

After deploying the hook and re-running my count, the truth emerged.
Little more than a dozen real `+next` tasks instead of the many more the tags
claimed.
My project-health report was usable, because the numbers it fed on stopped
lying.

Of course - you can also safeguard your scripts against these issues (as my
report now only touches live-tasks as well), but simple tag hygiene like this
will also make your whole taskwarrior harness just that little bit more lean.
The overdue list, the next-action list, the "which project has no next action"
check -- all of them get more honest the moment live tags stop surviving their
tasks.

The full hook above lives in my taskwarrior data directory alongside the other
hooks.
It is short enough to reproduce from the snippets above, and the only part that
is actually required cleverness is the bit that does not look clever at all:
reading a line of input you never use.

Thank you for reading!
