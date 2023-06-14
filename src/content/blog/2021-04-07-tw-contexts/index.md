---
title: "The concept of contexts in taskwarrior"
description: "Categorizing tasks with views instead of meta-data"
pubDate: "2021-04-07T10:00:00+0200"
weight: 10
tags:
  - taskwarrior
  - commandline
---

Taskwarrior provides you with three terms of categorization for your tasks:
projects, tags and contexts (in addition to reports and manual filtering).

While you can use them any way you wish to sort through the task jungle,
there _are_ inherent differences which make them more suitable for specific uses than others.
Today, I want to concentrate on contexts as a conceptual building block in taskwarrior.

Because, even if they seem to make sense in the list of categorizations above,
contexts share less conceptual overlap with projects and tags than with taskwarrior's filters and reports.

## Categorizations

First of all, let's define the difference between what tags and projects do,
and what filters and reports do in taskwarrior:

Fundamentally, tags and projects constitute _meta-data_ for tasks.
They are something that a task has (tags),
that a task belongs to (projects),
or that further describes a task (tags or description).

Filters and reports, on the other hand,
provide a _view_ on tasks.
They do not change the tasks themselves and are not something that you attach to a task,
but they change how tasks are presented to you.
In general, think of a context as being a more permanent filter.

That means, they allow quicker access to the tasks you want to see by providing another window into them.
In other words, they are an operation that you apply to your _task list_ instead of individual tasks,
not unlike looking at `t list`, `t completed`, `t +TODAY`, or `t /enjoy/`.
The thing that makes contexts different, however, is permanence:[^permanence]
Once you set a context (with `t context <mycontext>`),
taskwarrior will not display _any_ tasks falling through the filter until you switch out of the context again.

Contexts, being permanent filters, are a way to completely change your viewing angle on your task list and the information presented to you _without_ changing your task list itself or your tasks' meta-data.

[^permanence]: Of course, permanence should be understood in relative terms here. Being a filter, it does not permanently change your task list, but it does change your view of it: the information that is presented and the information that is kept hidden.

Thus, before we delve into examples: \
While tasks _have_ certain tags
(they may describe properties and attributes of a task, or certain circumstances)\
and _belong_ to a specific project
(they form part of a larger unit of accomplishment)\
they can be _viewed_ in different contexts
(sometimes they should be hidden from the user).

## Creating contexts

As per the taskwarrior [documentation](https://taskwarrior.org/docs/context.html),
though we will be using `t` instead of the full `task` command throughout.
Working with contexts is easy:

```sh
t context define personal +personal or +home
t context define work +work
t context work
```

Here, two contexts are defined,
then we switch to the `work` context which only shows tasks tagged as `+work`.
Contexts defined this way get set in your `taskrc` file, meaning they remain saved in your configuration.
You can alternatively define them directly in your configuration file in the following way:

```cfg
# taskrc

context.personal = +personal or +home
context.work = +work
```

We can list our contexts and their definitions with `t context list` which also shows us which context, if any,
is currently activated.
If we only want to see the currently active context instead, we can do `t context show` and get a single answer containing the context name and definition.[^keywords]
And, to delete a previously defined context, do:

[^keywords]: This also means, incidentally, that you can not create a context named either `list` or `show`. If you try to do so through taskwarrior's `t context define` command, it will tell you just this. However, you can very well create them in your configuration file but it will be difficult to switch to them interactively --- the only way to then activate the context is also through your configuration file. In general, I would suggest you refrain from using contexts named like this, and to be honest I don't know which use you would really get out of the two keywords anyway.

```sh
t context delete personal
t context delete work
```

Or, delete the line from your configuration file.

## An example: locations

Here is an idea for contexts to make the difference more clear:

An out-and-about _tag_[^unterwegs]
separates tasks I have to be at home for to accomplish and those I have to be somewhere else for.

Examples are `t add buy milk +errand`, `t return library books +errand`, `t empty dishwasher +home` or `t pack library books +home`.

For tasks that can be done anywhere you simply do not use a location tag --- simple.
Then you set the context for being on the move with `t context outside` and have a clean look at _only_ the tasks you can accomplish in your current situation.
There are two possibilities for creating a context here:

```cfg
# taskrc

context.outside= +errand
```

It seems the logical choice to display everything tagged as doable for you.
But remember that contexts filter things out.
Filtering out everything that does not carry an `+errand` tag thus also filters out all the tasks which do not care where you accomplish them.

So, a more encompassing view might be more useful in this case:

```cfg
# taskrc

context.outside= -home
```

Instead of actively filtering _in_ everything you can accomplish on the way,
it specifically filters _out_ everything that you do not want to see,
an important difference.

When in doubt, I would always suggest using selective exclusion instead of selective inclusion for contexts ---
it prevents missing important tasks
(one of the worst things that can happen in a task manager)
and you can always add exclusions if not enough has been excluded.

## Advancing the example: being precise

Doing something at one location or another like this becomes a binary distinction:
you have to do it specifically at home, or specifically not at home.

The selective exclusion suggested above already helps avoid some of the ambiguities in this dichotomy:
there are now things you have to do at home, things you have to do not at home, and things you can do anywhere.

But you could go further with this.
Let's say you usually do your `+errand`s in town, but the library is a bit outside and not really at the same location.
Then, for example `t add buy milk +errand` is something you do at one location,
but `t add return +library books +errand` you now do at another location
(the library, unsurprisingly).[^description]

With another location added, the `outside` context remains coherent
(since we used selective exclusion to define it)
but we can now drill down even further to specific locations:
Are we at the library and want to see what's there to do? `t +library`
shows us everything we can and have to do.
The outside context contains both ---
since they are defined as tasks not to be done at home.

This is where it gets a bit more complicated, however.
What if we want to see things we can do in town, but we don't want to travel to the library?
When we are in our `outside` context, we could invoke `t -library` to hide it away.
But what if there's a third location,
let's say a `+market` somewhat far away from the others?
Well, we could invoke `t -library -market` every time we're in town to show us just those things that we can accomplish here.
But this is where contexts shine:
If you are repeatedly and for longer stretches of time in town,
so that there is a sizable amount of tasks you want to specifically accomplish here,
build a context around it:

```cfg
# taskrc

context.intown = -home -library -market
```

By utilizing this technique,
we have created a new view onto our tasks _without_ having to change their meta-data.
We didn't have to specify a new `+intown` tag since in our example it might not make sense to do so.
'In town' is not really a precise location for a task to have,
with tags like `+supermarket` `+barber`, `+bank` perhaps making more sense for our other errands.

By excluding tags from other locations, we have now created a context which contains all of these locations,
without having to add any _additional_ tags.
We loaded categorization work from each time we enter something to a one-time change in our configuration,
by creating a new more permanent view onto our tasks.

On the other hand, it might make complete sense for you to define a `+town` tag and be done with it.
The amount of granularity is something that will be completely up to you and the amount of chores you have to accomplish wherever you are.
In general,
I would urge you always to start with the minimum and work your way up as more complexity becomes necessary.
After all, maybe even the basic binary choice of `-errand` vs `-home` might be enough for you ---
it certainly was for me for a long time.

[^description]: Be careful with turning parts of the description into tags. In taskwarrior, tags do not stay in the text-flow, meaning they get removed from the description itself. What remains here is `return books` with the tags `+library +errand`. It works in this specific case, but can sometimes make the description a senseless jumble of words if you always do it --- don't do the same for `return overdue at the library` for example.

## Advancing the example: task relationships

Taking one of the examples above,
with taskwarrior's dependence feature you can ensure that you remember to pack your books before trying to return them to the library:

```sh
$ t add pack library books +home
Created task 4.
```

Then we add:

```sh
$ t add return library books +errand depends:4
Created task 5.
```

This will make taskwarrior automatically boost the importance of packing your books at home
and reduce the importance of returning them if you forgot to do so,
regardless of the context you view it through.

You could even create another task `t add go to library` which does _not_ carry a specific location tag
(you can start doing this from wherever you are),
but which also only makes sense after you packed your books.
So, doing `t add go to library depends:4` will create a task that you can do anywhere,
but which is only productive for you to do after solving its dependence.

Then, if you modify the return books task to `t 5 mod depends:4` you have created a task chain.
And even if you switch to a `context outside` and the book-packing task will be hidden,
the dependency-chain will be kept intact and your other tasks reduced in urgency accordingly
(remember, contexts change the _view_ into your tasks, no data of the tasks themselves).

But now you have to be careful with retaining an overview of the dependency chain,
which is why I would urge you again to be careful with too many exclusions through contexts
and suggest to only selectively exclude specific task properties.

This dependency chain might be a little contrived for the example of returning books ---
I usually don't have a task to go to the library for example,
since it does not _accomplish_ anything on its own.
Yet I hope it clarifies the ways that changing task meta-data and changing task views can interact to create a more precise listing and overview of your tasks,
but also the ways such complexities can multiply and become harder to keep track of when taken together.

## A plethora of use cases

But I can accomplish all of this with filters,
I hear you say.
And in essence, it is the truth.

Remember that I talked at the outset about contexts being more permanent filters.
And that is exactly what their use-case is:
providing a more permanent filtered view into your tasks,
without having to re-specify this viewing angle every time as long as your context stays the same.

If your task list should change to a specific sub-set of its overall contents for a reasonable stretch of time without you having to think about it,
that is exactly when contexts are at their strongest.

This can be your working hours, during which you do not want to think about `-housekeeping` tasks or `project.hasnt:personal` projects.[^exclusion]

It can be client work where anything `+clientname` related might suffice,
or anything `-other -clients` related should be hidden.

It can be the aforementioned locations that I only want to see feasible tasks for.

Or, if you are like me and every now and again have a time where you are just exhausted,
and old and overdue tasks pile up into an unbearable nightmare of task fatigue,
it can simply be a stress-free context which removes anything but the lowest-hanging fruits for a while,
to get you back on track:

```cfg
# taskrc

context.stressfree = -OVERDUE +low-energy
```

But before going overboard on contexts,
if you are just after a specific view on your task list,
stick with filters or reports.

I suppose the heuristic for this decision should roughly be:
Do I need a specific view into my tasks? Create a filter.
Do I frequently need a specific view into my tasks? Create a report.
Do I frequently and for a long period of time need a specific view into my tasks? Create a context.

Because, remember,
you can accomplish all of this with filters.

## Task set context conclusion

These are the conceptual tips I have regarding contexts.
The important things for you to take away here are:

- Contexts are _permanent filters_.
- Contexts change _the view_ of tasks, not tasks themselves.
- Contexts _rely_ on meta-data (tags,projects,dates) to work.
- Contexts should be selectively _excluding_, lest they hide too much.
- Contexts are for prolonged _filtering without thinking_.

And as a last point for your consideration,
contexts are an amazing use case for automation ---
think about all the ways you can categorize your needs and life contexts,
and how your task list can begin to smartly anticipate them:
that's where contexts shine.

[^unterwegs]:
    Here, the German language helps me in my task list since it has a nicely descriptive singular word for being in transit that I just apply to all my tasks not to be done at home.
    I will use `+errand` in the following section,
    with the understanding that it is somewhat of a limiting choice for this description.
    However, it is easier to type and more descriptive than doing `+intransit` or `+ontheway`,
    wouldn't you say?
    Or am I just missing a concise phrasing here that exists for this purpose?

[^exclusion]:
    Again, this is an instance where I would prefer selective exclusion over inclusion by the way. I have, for example, tasks not belonging to a work project, that I might still want to see during work hours ---
    perhaps I have `+social` tasks that affect my co-workers, or something to be done in the `+office`.
