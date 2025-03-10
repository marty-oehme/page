---
title: Taskwarrior v3 git backups
description: Adapting backups to the new sqlite backend
pubDate: "2025-03-10T18:42:27"
tags:
  - taskwarrior
  - git
weight: 10
---

## The issue

For roughly a year now I have been running the 'new' [taskwarrior](https://taskwarrior.org) version 3 as my todo management application.

With the major version change came one significant breaking change:
tasks were no longer stored in plain-text `*.data` files, but migrated to an sqlite backed database which a new 'taskchampion' program was reading from.

With this came the necessity (for existing version 2 users like me) to manually migrate the database from the old to the new.
I did so.
And then I promptly forgot all about it and went back to task management business as usual.

For a couple weeks now, the interactions with my taskwarrior installation have been getting slower and slower,
going down to an absolute _crawl_ when used through frontend tools such as [taskwarrior-tui](https://github.com/kdheepak/taskwarrior-tui) or the [neowarrior.nvim](https://github.com/duckdm/neowarrior.nvim) vim plugin I have been experimenting with.

It finally got bad enough to where I had to step in and investigate.
After first accusing the frontends of just being slow, I noticed that similar slowndowns affected my actual taskwarrior cli interface,
and, wading into the taskwarrior database,brought to mind again the switch to an sqlite database.

I [`dust`](https://github.com/bootandy/dust)-ed the data directory (`~/.local/share/task` on my machine) and -- would you look at that --
it took almost 1GB of disk space.
That definitely seemed off for a couple (hundred) of tasks and nothing else.

I had in fact been commiting the complete sqlite database to the repository each time any taskwarrior commands ran.
And I run a lot of commands.
So there were thousands of commits changing the 'binary file' of the taskwarrior database,
and thus committing the whole file each time.

## The fix

That wouldn't do.
Git is not really well suited to track changes in binary files,
and least of all if each change is tracked for each dinky taskwarrior command and fully committed.

So, I have now changed the logic of my git synchronization a little.
Beforehand I had a hook which would run on each 'exit' of taskwarrior
(a full command having been completed, be that an add, delete or modification of tasks)
and commit any changes to the repository.

Now we have a slightly different trigger and some changed logic.
Since we cannot directly commit the sqlite database, we instead use taskwarrior to first export its tasks in json format
(`task export > tasks.json`).
Then we ask git if there are any changes, and tell it to commit them if so.

```sh
DISABLE_HOOKS=true env task export > "$data_dir/tasks.json"
# after any command, if there's changes add and commit
if ! git -C "$data_dir" diff --exit-code >/dev/null 2>&1; then
    # echo "found changes"
    # need to run to fully update tasks that just got done
    DISABLE_HOOKS=true env task next >/dev/null 2>&1

    header="auto: ${2##* }"
    msg="full command: $2"
    git -C "$data_dir" commit "$data_dir/tasks.json" -m "$header" -m "$msg" --no-gpg-sign >/dev/null 2>&1
    [ $QUIET = "true" ] || echo "Backup up to git."
fi
[ "$REMOVE_JSON" = true ] && rm "$data_dir/tasks.json" >/dev/null 2>&1
```

Now, that is already all there truly is for the changed logic to work at a fundamental level.

But I thought task exports would probably be pretty time-wasting to accomplish each time we run a command (it is not even that waste-ful however),
so I also implemented a timed threshold to wait a minimum amount of time between git synchronizations.

The easiest way I found for this implementation for now is to just get the unix timestamp of the last commit
and compare it to the current time (plus whatever arbitrary time we want to wait).

```sh
last_commit=$(git -C "$data_dir" log -1 --format="%at")
# This should be before the commit logic above.
# if now is not yet greater than last commit + wait time do nothing
if [ "$(date "+%s")" -lt $((last_commit + MINIMUM_WAIT_TIME)) ]; then
    exit 0
fi
```

Put together we can now have a fairly flexible automatic backup on 'schedule'[^sched] even without any daemon required.

One last important piece of the puzzle is preparing the repo:

Initialize a new git repo in your taskwarrior database directory, create an empty `tasks.json` file and commit it.
Personally, I also commited the synchronization hook itself and a `.gitignore` file which ignores the database.
Then, you are ready to use taskwarrior as normal and it should just back itself up without any input from your side.

As one final touch I have the repository automatically push and pull itself from a remote when we run the taskwarrior `synchronization` command,
to actually back it up at a remote place.

## The code

This should take care of everything.
There might be some rough edges still for now, but here is the code as it currently stands on my machine fully:

```sh
#!/bin/sh
# Automatically git commits, pushes and pulls if doable in the taskwarrior data directory
#
# The minimum amount of time required between 2 commits in seconds.
# So only if the last commit is at least x seconds old will a new one
# be created. Set to 0 to sync each taskwarrior change.
MINIMUM_WAIT_TIME=600

# Do not display status information.
QUIET=true

# Removes the tasks.json file after each run, keeping the
# task directory clean.
REMOVE_JSON=false

if [ "${DISABLE_HOOKS}" = "true" ] || ! command -v git >/dev/null 2>&1; then
    exit 0;
fi

if [ "$1" != "api:2" ]; then
    printf "Taskwarrior uses different data API version than git plugin. Aborting!" 1>&2
    exit 1
fi


data_dir="$(echo "$5" | cut -f2 -d:)"
command_run="$(echo "$3" | cut -f2 -d:)"

last_commit=$(git -C "$data_dir" log -1 --format="%at")
# if now is not yet greater than last commit + wait time do nothing
if [ "$(date "+%s")" -lt $((last_commit + MINIMUM_WAIT_TIME)) ]; then
    # TODO: Implement DEBUG msg level (info/debug) system
    # echo "Too early to check for changes, exiting."
    exit 0
fi

# echo "EXPORTING TASKS"
DISABLE_HOOKS=true env task export > "$data_dir/tasks.json"
# after any command, if there's changes add and commit
if ! git -C "$data_dir" diff --exit-code >/dev/null 2>&1; then
    # echo "found changes"
    # need to run to fully update tasks that just got done
    DISABLE_HOOKS=true env task next >/dev/null 2>&1

    header="auto: ${2##* }"
    msg="full command: $2"
    git -C "$data_dir" commit "$data_dir/tasks.json" -m "$header" -m "$msg" --no-gpg-sign >/dev/null 2>&1
    [ $QUIET = "true" ] || echo "Backup up to git."
fi
[ "$REMOVE_JSON" = true ] && rm "$data_dir/tasks.json" >/dev/null 2>&1

if [ "$command_run" = "synchronize" ]; then
    DISABLE_HOOKS=true env task sync

    git -C "$data_dir" pull >/dev/null 2>&1
    pull_ret="$?"
    git -C "$data_dir" push >/dev/null 2>&1
    push_ret="$?"
    if [ "$pull_ret" -eq 0 ] && [ "$push_ret" -eq 0 ]; then
    [ $QUIET = "true" ] || echo "Git upstream synchronized."
    fi
fi
```

[^sched]: Truthfully of course it is only a fake schedule, since if we never run taskwarrior for a long time it will also not update anything.
    For a true schedule you could put the commit logic behind a cron job or similar.
