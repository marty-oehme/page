---
title: The next action
description: |
  Always know what to work next for your projects
pubDate: 2026-09-30T20:10:35
tags:
  - taskwarrior
weight: 10
---

I keep relearning the same lesson every time I look at a stalled project:
The project itself is rarely the problem.
Instead it usually either boils down to one of two things -- the ultimate
project goal not being phrased in a coherent or reachable way, or, as is often
the case, that you don't know exactly which small action to tackle next.

The problem is that when no next action is written down, the first thing you'll
have to do when you sit down is figure out what to do all over again.
That is precisely the moment where many will close the laptop or go do something
else instead.

So that's the plan for this post:
ensuring a next action for your projects.

## The concept in about a minute

GTD makes a distinction that sounds pedantic but makes sense for actionability.
A project is an outcome, and an outcome is not something you can do.
"Get a new job" is not an action.
"Test the backup recovery" is not an action.
What you can do is one concrete, physical step.
"Open the job board and save three interesting postings." or "Write down which
keys the test environment needs."

GTD calls that step the next action, and it comes with a strict rule:
every project has exactly one.
Not a category, not a direction, one doable thing.
If you can't name it, the project is stuck.
No amount of reorganizing the project list will unstick it, if you're not sure
what the next step needs to be.

The next-action list is then what you actually work from, instead of staring at
outcomes and feeling bad about them.

## What it means for Taskwarrior

Taskwarrior has a tag for this, and by default this one is genuinely special:
`+next`.
Tag a task with it and Taskwarrior raises its urgency by a fixed amount, so next
actions sort above everything else in the `next` report without having to set a
priority or a date.

```ini
urgency.user.tag.next.coefficient=5.0
```

Essentially, that one line is the whole mechanism.
A `+next` task gets five urgency points on top of whatever else it carries,
enough to float it to the top of `task next` while still letting a genuinely
overdue task outrank it.
It is a thumb on the scale, not an override.

I generally keep to GTD's rule:
one `+next` per project.
When I finish a next action, the project has none until I write the new one, or
promote one of the existing project steps to be the next, which is the point.
It forces the small moment of "so what actually happens now" instead of letting
the project drift for another month.

## The setup

Two pieces:
Together with the urgency line above, I needed something that tells me which
projects have no next action (or too many next actions!).

The result is a small script, `tw-review-projects`, which reads my tasks and
sorts projects into three piles:

1. no `+next`
2. exactly one `+next`
3. several `+next`

It prints out these three piles as simple lists with the project in question
and, if there is a project which has no `+next` action, a reasonable candidate.
Here is some example output:

```text
PROJECT REVIEW - 19 active projects (83 tasks, 17 orphans not shown)
========================================================================

[!] NEED NEXT ACTION (1)
   gtd.Bugwarrior-bridge-tw   candidate: Wait for answer to upstream PR

[+] HAS NEXT ACTION (19)
   paperless.importing                          5 task(s)   next: scan inbox
   blog.write-gtd-tw-series                     8 task(s)   next: Polish article on taskwarrior color scheme design
  ...
```

The first pile is the main one worth looking at, and right now it is nearly
empty.
But as you can see, my `gtd.Bugwarrior-bridge-tw` project has no next action
assigned.
My other projects are all good and green and have an available next action.
With this overview you can make an educated decision on what to handle next, and
more importantly, see at a glance which projects are on track and which may be
stuck or need some rethinking.

The script comes with two command line options, `-a` which shows your projects
alphabetically rather than by contained task count, and `-s` (for short) which
_only_ shows you potential issues and hides all the projects that are already
fine.
You can grab the code for it below.

An honest note on the candidate:
The proposed candidate for projects missing a next action is simply the next
highest-urgency task.
Taking the highest-urgency task and calling it the next action is really a
decision prompt, not an answer.
For example, above:
"Wait for answer to upstream PR" is not really an action at all, it is a
waiting-for, and it belongs behind a `wait:` date, not in `+next`.

I wrote the report to suggest, not to decide for you, because the moment it
decides I have a project with a fake next action, which is worse than one with
none.

## The ritual

Next actions get set in the weekly review:
every active project gets a clear action in `+next`.
Since I am a fan of aliases, I have the script aliased to `trn`
(task-review-next) in my setup, so in practice for me that is:

```sh
trn -s
```

and then dealing with the `NEED NEXT ACTION` rows.
No projects shown?
Everything is already fine and dandy.
For a normal week it just takes a minute, you can even incorporate it into your
daily review routine.

If a project keeps showing up there with a candidate I never accept, that is
also information, not failure.
Either the project is not concrete enough to have a next action, or it is a
someday-maybe in a project costume, and it should move to the maybe list or the
reference shelf.

The other half of the ritual is the quiet one:
when I complete a next action in the todo shell, a hook strips the `+next` tag,
and the project drops back onto the report as needing a new one.
The list stays honest without me policing it.

## What I did not do

I do not use priority for this.
Priority is importance, `+next` is 'doability', and the two can disagree.
A high-priority project can have a boring next action, and a low-priority one
can have a very clear one.
I prefer both signals visible rather than collapsed into one.

I also did not automate the assignment.
Nothing picks the next action for me, because choosing it is the thinking part,
and the point is to do that thinking once in the review instead of every time I
open the list.

## Resources

- Getting Things Done, David Allen, for the next-action rule
- The
  [taskwarrior urgency documentation](https://taskwarrior.org/docs/urgency/),
  where the `+next` coefficient lives
- The `tw-review-projects` script in my dotfiles or below

## The full script code

This is the version of my 'next-task-for-each-project' review script as it
exists currently.
At the following
[link you can view an updated version](https://git.martyoeh.me/Marty/dotfiles/src/branch/main/office/.local/bin/tw-review-projects)
if it ever changes.

```python
#!/usr/bin/env python3
"""tw-review-projects: GTD project health for daily/weekly review.

Checks the amount of +next tagged tasks each project has. Reports projects with
too many or no +next tasks at all.

Groups active projects (>=1 pending task) into:
  NEED NEXT  - 0 pending +next (define one, Step 7)
  HAS NEXT   - exactly 1 pending +next
  TOO MANY   - >1 pending +next (pick the single true next action)

For NEED NEXT projects, shows the highest-urgency pending task as a candidate.
Excludes the (none)/orphan bucket, which the declutter issue owns.

Options:
  -s   short mode: only show problems (NEED NEXT + TOO MANY)
  -a   sort alphabetically (default: by task count descending)
"""
import argparse
import json
import subprocess
import sys
from collections import defaultdict

# a configurable amount of +next items after which a project is viewed as
# having 'too many'. Will mostly be 1, but some people like to have more than
# one defined.
MAXIMUM_IDEAL_NEXT_AMOUNT = 1

GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"
RESET = "\033[0m"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-s", action="store_true", help="short mode: problems only")
    parser.add_argument("-a", action="store_true", help="sort alphabetically")
    args = parser.parse_args()

    data = json.loads(subprocess.check_output(["task", "export"]))
    pending = [t for t in data if t.get("status") == "pending"]

    projs = defaultdict(list)
    for t in pending:
        projs[t.get("project", "(none)")].append(t)

    def urgency(t):
        return t.get("urgency", 0.0)

    def desc(t, width=60):
        d = t.get("description", "")
        return d[:width - 1] + "\u2026" if len(d) > width else d

    rows = {"need": [], "has": [], "many": []}
    for proj in sorted(projs):
        if proj == "(none)":
            continue
        tasks = projs[proj]
        nexts = [t for t in tasks if "next" in t.get("tags", [])]
        if not nexts:
            cand = max(tasks, key=urgency)
            rows["need"].append((proj, len(tasks), cand))
        elif len(nexts) <= MAXIMUM_IDEAL_NEXT_AMOUNT:
            rows["has"].append((proj, len(tasks), nexts[0]))
        else:
            rows["many"].append((proj, len(tasks), nexts))

    def sortkey(item):
        return item[1] if not args.a else item[0]

    orphans = len(projs.get("(none)", []))
    nproj = len([p for p in projs if p != "(none)"])
    total = sum(len(projs[p]) for p in projs if p != "(none)")
    print(f"PROJECT REVIEW - {nproj} active projects ({total} tasks, {orphans} orphans not shown)")
    print("=" * 72)

    sections = [
        ("NEED NEXT ACTION", "need", "!", RED),
        ("HAS NEXT ACTION", "has", "+", GREEN),
        ("TOO MANY NEXT ACTIONS", "many", "x", YELLOW),
    ]
    for label, key, sym, color in sections:
        if not rows[key] or (args.s and key == "has"):
            continue
        c = color if sys.stdout.isatty() else ""
        r = RESET if sys.stdout.isatty() else ""
        print(f"\n{c}[{sym}]{r} {label} ({len(rows[key])})")
        for proj, n, t in sorted(rows[key], key=sortkey):
            if key == "need":
                print(f"   {proj:42s} {n:3d} task(s)   candidate: {desc(t)}")
            elif key == "has":
                print(f"   {proj:42s} {n:3d} task(s)   next: {desc(t)}")
            else:
                print(f"   {proj:42s} {n:3d} task(s)   {len(t)} next actions")


if __name__ == "__main__":
    main()
```
