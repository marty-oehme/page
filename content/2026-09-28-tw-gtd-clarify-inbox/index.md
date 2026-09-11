---
title: Clarify the inbox
description: |
  Moving from a captured item to a clear task
pubDate: 2026-09-28T17:59:05
tags:
  - taskwarrior
weight: 10
---

The first post in this series stopped before a full pass through the inbox, just
after setting up the quick capture harness for new tasks.
That was deliberate -- I wanted capture to be boring and the explanation
focused:
write the thing down, let it land in `+inbox`, and get back to what I was doing.
But the capture is only a half promise.
The other half is coming back later to the item and deciding what it actually
means.

That is what GTD calls _Clarify_.
The word sounds like tidying up a description, though I generally prefer to
think of _processing_ an unclarified task.
It is closer to making a small decision:
what exactly is this, and what should happen next?

A task with a neat title can still be a mystery.
A task with a rough title can be perfectly clear if I know where it goes.
Only you know exactly how to handle tasks at this step, but there are general
guidelines that help keep the process on track.

## Clarify is not filling in every field

In the first published inbox post, I noted that my task database held more than
170 pending tasks, 62 of them with neither a project nor a due date.
Those figures were that a snapshot of a different time in my repository, buf if
you have similar numbers it may be the case that A) you need to clarify more, or
B) you have many ideas for some day rather than actual tasks in your lists, in
which case you need to clarify more.

More importantly, a task without a project is not necessarily an unprocessed
inbox item.
It may already be clarified and simply be a one-off.
Similarly, the existence of tags or due dates does not necessarily denote
something being clear to you.
`+inbox` means something narrow:
I have not decided what the item is yet.
It alone signals whether a task still needs clarification.

The question is not "which tags should this task have?" Not yet.
First:
what kind of thing did I capture?

Some things may not be actions at all.
Maybe it is reference information I want to keep, a possibility for someday I
can choose to work on later, or an item that no longer matters.
Sometimes things are actionable, but the wording is an outcome rather than
something I can do.
And sometimes it really _is_ one small action, ready to go.

View the inbox as a decision queue, not a second task list.
Leaving everything in it means recording without deciding; adding dates and
projects just to fill fields means inventing decisions.
Neither makes the list useful.

## Work one item at a time

I start with the inbox report and take the first item.
The capture step stays quick; this is where I slow down enough, during
organizational downtime, or the daily review later, to understand what I wrote.

```sh
task context none
task inbox
```

Then I ask two questions.

1. What is it?
   Read the item, its note, and enough surrounding context to recognize what I
   meant.
   I do not need to solve the entire project at this point.
   I need to know what kind of commitment this is.
2. Is there an action?
   If not, it should leave the action system:
   delete it if it has no value, move useful knowledge to reference, or keep a
   genuine future possibility in `+maybe`.
   If there is an action, make the next step visible and give the item a home
   (will it be large enough to warrant a project, or is it a one-off step?)

The familiar two-minute rule fits here:
If the action really takes less than two minutes, I do it instead of storing a
tiny promise for later.
If it would take longer, I write the next physical step.
"Get the backup system sorted" is an outcome.
"Open the current backup notes and check which recovery step is untested" is a
step someone could actually begin.
The distinction seems simple, but it is often the difference between a list you
can use and a list that asks you to think all over again.

From there, the item's destination will result from the decision.
If the item needs several steps, it is an outcome, not one oversized next
action:
give it a project and write the first doable step.
For an active project, that step is the one I mark `+next`.
If it is a single action with no larger outcome behind it, it can stay on its
own.

- A one-off action can stay on its own.
  Not every task needs a project.
- An action that belongs to an outcome gets the relevant project.
  `+next` marks the one action I have chosen to move an active project forward.
  The project is the result while the next action is the thing I can do.
- Something another person needs to do can wait until a real follow-up date.
  In this setup, `wait:` hides it until then, and `task waiting` gives me a
  place to check it during the weekly review.
- Something I might do someday belongs in `+maybe`, not among the actions I am
  committed to now.
  If I have decided I will never do it but want to keep the knowledge, it
  belongs in reference instead.
- A real deadline can get `due:`.
  A date that only means "I hope to do this then" is _not_ a deadline, and
  adding one does not clarify anything.

Remember:
There is no bonus for creating more metadata.
A project, context, due date, or `+next` tag is useful when it records a
decision I have actually made.
Otherwise it is just another field to maintain.

Once an item has a destination, I remove `+inbox`.
The tag means exactly one thing -- unprocessed -- and not "important" or "please
look at me again."

My task completion hook removes the `+inbox` tags from tasks I finish
immediately, but for tasks I keep, I _manually_ remove it as part of routing.
It's the last conscious decision for a task in the 'Clarify' stage for me,
saying:
This is clear.

That's it.
This flow and its repetition are what lets the inbox report stay a queue rather
than slowly turning back into a junk drawer.

## Clarify, then organize

GTD separates Clarify from Organize for a reason.
Clarify answers what the item means; Organize puts that answer in the right
place.
In Taskwarrior, I often do both in the same edit.
That does not make them the same decision.

For example, deciding that an item is an action does not yet tell me its
context.
A context answers what conditions let me do it, not what topic it is about.
And deciding that an item belongs to a project does not make it that project's
next action.
The project may already have one, or the new item may be waiting on someone
else.
I want the fields to follow the decision, not to stand in for one.

This is also why I do not use priority as a substitute for clarity.
A task can be important and still not be actionable, or easy without being
important, or even urgent while being unimportant.
First decide what it is; then use the rest of the system to choose when and
where to do it.

## Empty is a useful stopping point

The aim is to get `+inbox` to zero, but zero is not the same as finished.
Some items will be done; some will now be clear tasks, projects, waiting items,
possibilities, or reference.
The inbox is empty because each item has a decision and a destination, not
because every commitment has disappeared.

That is enough for one pass.
If this seems daunting, try to remember:
You do not need to clean every old project now or turn inbox processing into the
weekly review.
The reviews later check whether these decisions still hold and whether projects
have a next action.
