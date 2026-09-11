---
title: An inbox for the brain
description: Simply mapping the GTD inbox onto taskwarrior aliases and reports
pubDate: 2026-09-12T11:53:21
tags:
  - taskwarrior
weight: 10
---

Some context first:
Over time, my taskwarrior list had slowly turned into something between a junk drawer and a guilt archive.
At the start of this little overhaul it held over 170 pending tasks, and 62 of those had neither a project nor a due date.

In practice this means: no reason to ever surface, and no reason to ever get done.
Somewhere in that pile were things I actually want to do.
The rest was noise wearing a todo-list costume:
Ideas, Someday-maybes, wishful thinking, actual deadlines, and even tasks I had already accomplished.

So I refocused on the essentials.
In the process of re-reading Getting Things Done (and nodding along), I started to really map the parts that make sense onto the tool I already use, rather than migrating my entire life into a shiny new app for another time.
After all, taskwarrior is presented as a highly flexible tool.
Use it to your advantage: script the behavior you want into the tool,
rather than changing your routine around it.

This post is the first piece of that mapping: mapping the inbox onto taskwarrior.
At the same time it is the start of a series of posts which deal with mapping GTD concepts onto taskwarrior in a more general sense.
We will deal with the inbox, contexts, tags, projects, priorities, colors and more.
But let's focus on arguably the most important aspect up front: the inbox.

It is deliberately tiny as that is the point of the inbox --
get it out of your brain, into your system.
Keep the blast radius of changes small so it presents only a tiny deviation from your previous taskwarrior habits.
Then trust the system to keep and surface what you need.

## What I wanted

My requirements, written down before touching any config so I could not weasel out of them later:

1. Capturing a thought must take under two seconds and require _zero_ decisions.
2. Processing captured stuff must be one repeatable flow, not a fresh judgment call per item.
3. The inbox has to end up empty regularly, or I will stop trusting it. And once I stop trusting it, I stop feeding it, and then everything lives in my head again, quietly rotting at 2am.

That third one is the central pillar, the one true requirement, I think. Everything else is plumbing:
important, but interchangeable.

Finally, for the moment, I prefer interface _additions_ to _changes_, except where they contradict.
The idea here is to make it easy to migrate from the old system to the new,
while continuing to use it productively.

## The GTD idea worth stealing

Of all the GTD machinery, the insight that actually changed how I built this is embarrassingly simple:
capturing and clarifying are different activities,
and they should happen at different times.
When a thought arrives, you just write it down as quickly as possible so it doesn't interrupt your current flow.

You don't have to decide what the item means, which project it belongs to, or whether it deserves to exist.
All of that comes when processing.
While you can add some info if you know it already, actual decisions about the task's filing and organization happen later, in a batch, when you feel like deciding (usually at the end of a day during the daily review).

Most of my previous longer-term capture attempts failed exactly there, I believe.
I tried to file the thought correctly at the moment I had it -- pick a project, guess a due date, choose a priority -- and filing correctly is work, so after a while I just didn't keep up.
The thought stayed in my head, which is the one place with guaranteed data loss.

So: two seconds, description only, done.

## Keep it simple: inbox aliases

Let's start with the simple wiring part, a new alias.
Of course you can also change your existing `task add` alias if you have one,
but according to my above goals, we'll _add_ to the interface here:

```sh
alias tin="task add +inbox"
alias tinbox="task inbox"
```

These two are now sitting in `~/.config/sh/alias.d/taskwarrior.sh`, ready for use.[^alias]

[^alias]: In my dotfiles all `*.sh` files listed in the `alias.d/` dir are automatically loaded by the shell on startup. This allows me to have multiple files for multiple tools, keep them modular in my git repo, and be more modular for multi-shell purposes. On your end, put the aliases into whatever file you use to set up your own shell aliases.

For context, that same file defines my general entry point, a little `t()` wrapper that drops me into the tasksh shell when called bare and passes anything else straight through to `task`:

```sh
t() {
    # check for existence of tasksh before doing this whole song and dance
    if type tasksh >/dev/null 2>&1 && [ "$#" -eq 0 ]; then
        tasksh
    else
        task "$@"
    fi
}
```

I have an existing `ta` alias calling my traditional `task add` where I had to file it on capture, and `tal` which aliases quickly logging an already-accomplished task.

The new aliases keep it simple and slot right into that family:
`tin "call the dentist"` captures a thought from anywhere,
and `tinbox` will show me later what needs clarifying.

## The missing piece: a report

The aliases are done, but `tinbox` points at a report that does not exist yet.
So into the taskrc goes the only actually new taskwarrior configuration this whole endeavour needs,
a custom report listing our inbox items:

```sh
# Inbox report: unprocessed GTD capture items (+inbox tag).
# Process until empty: route each item, then strip +inbox.
report.inbox.description=Unprocessed inbox items
report.inbox.filter=status:pending +inbox
report.inbox.columns=id,description.count,project,due,priority,tags
report.inbox.sort=entry+
```

Some deliberate choices in there, mostly about keeping the report _boring_ and thus predictable:

- `sort=entry+` shows oldest first. Inboxes should drain in capture order, FIFO --
  otherwise old items sink to the bottom forever and quietly become permanent residents.
- `description.count` keeps long descriptions truncated but shows an annotation counter,
  so I can see at a glance if past-me attached more context to something.
- No urgency column, no dates front and centre. The inbox report is a _work queue_,
  not a prioritisation view. Prioritising is explicitly not its job.

By the way:
With this naming scheme we can also show this report via `task inbox`,
so the `tinbox` alias above is not strictly necessary if that is short enough for your needs.

## The routing: what happens after capture

Processing is one flow, run per item, top of the list down. For each thing in `tinbox`, exactly one of:

1. **Doable in under two minutes?** Do it now, mark done. The inbox-processing session itself is where quick wins live.
2. **Actionable, single step?** Give it whatever metadata it deserves -- project, context, effort, maybe a due date -- and remove `+inbox`.
3. **Actionable, multiple steps?** Promote it to a proper project, create the necessary starting tasks.
4. **Someday, maybe?** Swap `+inbox` for `+maybe`.[^ideas]
5. **Relevant at a specific future date?** Set a `wait:` date and drop the tag.
6. **Pure reference material?** Off to my ideas repository it goes.[^reference]
7. **Rubbish?** Delete without ceremony. This one is hard to get used to, but can be really satisfying.

[^ideas]: I have a separate taskwarrior data directory (`$TASK_DATA_IDEA`) that only receives someday-maybe and reference material, wrapped in its own little `idea()` shell function. Keeping it physically apart from the main list means the main list stays actionable, and the ideas stay guilt-free which allows me to keep collecting ideas without cluttering actionable futures.
[^reference]: The reference notes are also a plaintext notes directory. In my case I use [`zk`](https://github.com/zk-org/zk) as note management software as [I sing its praises here](/blog/2024-02-07-zk-in-my-notetaking), but you can use anything of course. This is not strictly related to our taskwarrior GTD implementation.

And then the invariant that holds the whole thing together: an item loses `+inbox` the moment it gets routed.
The tag means exactly one thing -- _unprocessed_ -- and nothing else.
The moment processed items are allowed to keep lounging around tagged as inbox,
the report stops meaning anything, and requirement three quietly dies.

Currently I keep it as a deliberate `-inbox` when processing to hammer this point home to myself.
It has become second nature and adds a tiny notion of second-guessing --
do you really want to take this on --
moment that can be useful to me.

What I like about how this fell out of my existing setup: the routing barely does any work of its own.
My taskrc already gives any task tagged `+maybe` an urgency coefficient of -100 (someday items sink like stones) and `+next` a small boost (+5, actual next actions float up).

```ini
urgency.user.tag.maybe.coefficient=-100.0
urgency.user.tag.next.coefficient=5.0
```

So "processing" is mostly just swapping tags, and the urgency machinery I already tuned ages ago does the sorting for free.

## First contact with reality

When I fired the finished report up for a test, eleven items were already sitting in it --
I had been tossing thoughts in while setting the thing up, which I take as a good sign for the friction level.
Several turned out to be deletable without ceremony, which, again, satisfying.

I am deliberately not doing the first full processing pass in this post.
It can be a larger focus along with the piece this whole exercise is really building toward:
mapping your areas of responsibility onto taskwarrior contexts,
so that "what can I do right here, right now" becomes a query instead of a memory exercise.

## What I did not do

In the interest of completeness, the deliberately-skipped bits:

- No recurring daily review task: I know GTD people love their rituals, but a nagging recurring task is exactly the kind of clutter I am trying to dig out of.
  The alias-based habit has to carry it for now; if that fails, I will revisit.
  I also don't think taskwarrior is ideal as a 'habit-building' application, with more suitable options available.
- No launcher binding. Binding `tin` to a rofi/wofi prompt could make capture possible without even opening a terminal.
  Good idea, and I keep it in my tracker, not done -- because I basically live in a terminal anyway and the marginal gain is small. For now.
- No automation. Bugwarrior pulling issues into the inbox automatically will be coming in the future, but this requires establishing trust in the manual pipeline first.

## Additional resources

- [Getting Things Done, David Allen](https://en.wikipedia.org/wiki/Getting_Things_Done) -- the source of the capture/clarify split, whether or not you buy the rest of it.
- [Taskwarrior documentation](https://taskwarrior.org/docs/) -- reports, filters, and the urgency coefficients doing quiet work above.

Thank you for reading! May your inbox always be smaller than your head.
