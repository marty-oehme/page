---
title: Purpose and context in task management
description: Differentiating projects and tags
pubDate: "2025-03-29T12:47:57"
tags:
  - taskwarrior
  - personal
weight: 10
---

I have recently begun to re-evaluate some of the approaches I have used for task organization in the last couple years.
While a couple things caught my eye that should be changed and questioned,
one differentiation instantly struck me that I neglected to keep up and it has really held back my productive outcomes:
clearly differentiating tags and projects.
Tags and projects define different 'layers' of things that need to be done.

At their base, the best explanation for projects I have heard is "outcome goals that require more than one action item".
This describes their nature well:
They are _outcome_ based, that is, they have a (defined, ideally) clear point of starting and clear point of ending;
they are _goals_, that is, there is some intended new state change as part of their accomplishment;
but they remain a _collection of actions_ which have to be undertaken to reach this end point.
Generally, when the goal of a project is reached it _ends_ and a different project takes its place [^softgoals]

Tags, on the other hand, describe the _context_ of a task, which, taken together, will all provide you ways of filtering your tasks.
So, they describe an _aspect of one task_, which can then be used to create groups of tasks.
These groups can feel similar to projects, and they are, but they do not have to adhere strictly to the properties described above.

Think of projects like the single purpose-based tag you apply to a task, while the others further describe its circumstances.

An example:
I want to build a kitchen shelf. This is a 'project' - it has a clearly defined start point (design and material acquisition) and end point (hanging shelf).
It has some 'soft goal-ness' to itself in that I have to make a decision if I want the shelf to be painted, decorated, filled with things,
but these are decisions that you (primarily) make when setting up for the project or in the initial goal-finding phase.
Then you have a task, e.g. 'buy wood'. This task should ideally be preceded by a 'figure out wood dimensions and material' task.
The 'buy wood' task can be described by its location ('+hardware_store' or '+en_route'),
by the people associated, for example if you rely on someone else to transport you,
and depending on how you structure your collections on a type of task as well, for example '+shop'.

The project this task belongs to could also be '+kitchen_shelf', but most todo lists make these purpose-driven tags primary and call them projects.
This is because, usually, each task you undertake in your life has a single purpose, one 'why',
but can have multiples of 'what', 'where', and 'how'.
Later on, multiple tasks can come together at the '+hardware_store' and you can check them off in one go when you're at the right location
even if they belong to different projects.
Or if you have a person tagged, you can check all of the remaining notes to be exchanged off in one go by filtering for their tag.

This is also how it is most easy to remember the difference clearly:
Ask yourself - is my project describing 'why' I am doing this particular thing?
Then ask yourself - are my tags describing the 'what', 'where' and 'how'?
If so, you have successfully described both context and purpose and the task should be easy to find, prioritize and work on in the future.

## Examples

Here are examples of some issues where this is _not_ upheld, taken from my own experience:

You host your own infrastructure, be that a public server or private documents and utilities.
You want to check up on your backup infrastructure -- ensure that it works well and can actually be restored from.
In my case, I have a task lying in my todo list which is the following:

```conf
proj: hosting
desc: test nextcloud backup recovery function
prio: M
tags: unix restic
sched: 2025-03-16
```

Now, it's not irregular for me to reschedule some of my tasks,
especially those that concern my hobbies and side projects.
They are not the absolute priority in my life and thus I am fine with changing deadlines around.

However, this task has now been staring at me for _ten weeks_ and I have not made any progress.
I'll go through the issues:

1. It is way too broad and not 'actionable' in a single step.
   How do I test this recovery? Which tools and materials do I need?
   I need to set up the necessary (test) infrastructure beforehand.
   All of this is encapsulated in a single task and this should be a clear signal that it is not _one_ step but multiple steps clumped together.
2. This automatically leads into the second issue: The task is multiple steps taken together, so they should be grouped and form a project.
   The current project, however, is a vague notion of 'hosting'. This does not fulfill any of the properties discussed above:
   It is not _outcome_ oriented (I am already hosting, but what is achieved when I reach 'hosting'?),
   it is not _goal_ oriented (when can I ever cross this project off my list?),
   and it is not a collection of actions that bring me closer to this end state (there are many different tasks collected in this project currently).
3. With the project changing, we should clarify that this task is part of what I am doing for my personal context of 'hosting',
   while it is not necessarily unix-related. This is less strict of an _issue_ but still important to think about. While more preference-driven,
   personally, I would still ask myself the pertinent questions: 'what' am I doing (working on my '+hosting' infrastructure),
   where am I doing it (on my '+homelab') machine,
   and how (by testing '+restic' backups).

Let's fix the issues:

```conf
proj: nextcloud-recovery-test
desc: recover last backup onto test infrastructure
prio: L
tags: hosting homelab restic
wait:  2025-04-10
sched: 2025-04-19
```

Things have mostly shuffelled around but I can instantly recognize a) the size of the task as its own little project.
b) the necessity of thinking about the steps which are still blocking this task, which would ultimately boil down to
setting up a test environment and gathering all the materials (keys, access codes) do so. c) Also recognizing that this is not my priority,
finding a reasonable date to reconsider, lower the actual task priority and schedule it for a time in my life where I may have enough spare time,
or can think about breaking it down further.

Simple changes but we now have an actually actionable step, know which steps we need to figure out before approaching this,
and can organize them all together under the banner of one project.
Additionally, I can see that something needs to be changed, removed or accomplished when this project lingers for a long time
in my todo list since it is not something vague such as 'hosting' which will always be a continual thing.

The task has turned from an 'idea' task (vague, hard to conceptualize, never to be turned concrete) into an actionable process,
a true _project_ to be approached.
It is often the 'idea' tasks which hinder our next step, become obstacles that loom larger as new things (and in the worst case more similar 'idea' tasks) pile up and overwhelm you.

Similarly, it is the 'forever-projects', those neither goal-oriented nor outcome-focused, which will linger in your list and not actually provide
the function of grouping one single 'project' together.
They can be fine as tags if you feel it a distinguishing contextual feature but should not provide the primary organizing matter.
While this may be a different topic, I would suggest to always remember:
Put purpose before context.

It's the reason most task systems are organized by projects and projects should give tasks purpose.
It will also lead to much fewer instances of lingering tasks, and, often even bring additional motivation.

One last example:

```conf
proj: flat
desc: fix middle strut of living room curtain rod
prio: M
tags: diy home
```

The curtain rod in my living is a little unstable and should soon be stabilized before it separates from the wall.
The issues should be more obvious now:

Flat is not a project but simply a doubling of the '+home' tag which I use for anything I should accomplish in my own four walls.
The project should instead be turned into 'fix-living-room-curtains'.
The description is okay and the task is _mostly_ actionable,
though I would prepend a 'figure out required curtain rod dowel' and perhaps 'figure out if new curtain rod wood is required',
which may turn out to then _also_ require new substeps of trips to the hardware store.

The tags are also generally alright for my organizational scheme (where? at 'home', how? doing 'diy') since the 'what' is fairly clear in this instance.
I might not have enough arms to accomplish this goal on my own so I would need to for example ask a friend,
which should,
ideally become its own pre-task once again but can be carried here as a tag as well --
so I don't forget to inform them when the actual task is due.

Speaking of due, this task currently carries the same priority as me testing my homelab backups and no due date at all.
Thinking it through, I have a strong belief this should be accomplished soon,
lest it fall down,
so this task really deserves a) a higher priority and b) at the very least a scheduled date in the near future.

Bringing it all together we have.

```conf
proj: fix-living-room-curtains
desc: replace middle strut rod and dowel
prio: H
depends: 1 2 3
sched: 2025-04-01
tags: diy home p.friend_name
```

Now it encompasses all the info it needs.[^info]
It depends on its previous tasks (get measurements, materials and help),
it has a scheduled date which is still somewhat flexible but points me into its urgency together with its actual priority.

The nice thing about modern digital todo applications is that they often use all this contextual information to better present your whole task-life to you.
In my instance, taskwarrior would be aware that I have a scheduled date set (in the near future) for this task and push it above tasks that come later.
It would also recognize it as a time frame I set for _myself_ (scheduled versus due-date) and thus still deprioritize the date from actual due-dates I have in my life.
Same thing with the priority which is now correctly set to 'high'.
If there are other tasks with similar dates they will now be ordered so that I first see this task and only further down something like testing my backups.

That's all there is to it,
and it always comes back to the same distinguishing features of purpose (why?) versus context (what? how? where?).
Following this more clearly will ultimately lead to fewer lingering 'forever-projects' and piling tasks of shame which are really more ideas than actual things to be done.

Of course, reorganizing this takes a bit.
So take the moment and also clean out your list --
is it mostly ideas pretending to be tasks?
Is it filled with 'areas' of your life in which you do things pretending to be projects?
Sort them, delegate them, and get them out of there if they don't work for you anymore.

[^info]: Perhaps even slightly too much info. While never in itself a bad thing, remember you are creating tasks to get them done not to have a nice task list. Like in minimal designs just put as much info into as needed, not more. This, I firmly believe, is something everyone needs to adjust for themselves and is different from approach to approach.

[^softgoals]: Some projects have 'soft goals' which are an end state which is satisfactory but not fulfilling. I.e. one could declare a project finished but also continue working on it and improving it. This is often the case with for example hobby projects and creative endeavours. I lean on the side of rejecting soft goals and creating a new project for a new goal instead since otherwise you can end up back at 'forever-projects' which we try to avoid with exactly their outcome-based property.
