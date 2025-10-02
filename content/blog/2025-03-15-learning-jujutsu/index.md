---
title: Learning Jujutsu
description: A new git-based versioning paradigm
pubDate: "2025-03-15T11:13:53"
tags:
  - git
  - jujutsu
weight: 10
---

Having heard of the new kid on the block 'jujutsu', about a month ago I started a little experiment.
I had already gone through a little tutorial and played around with it a little in a test repository.

Though I understood the theoretical ramifications of the changes,
I could not quite wrap my head around the practical implications or how I would use it day-to-day.
Even more so, I didn't quite grasp how much it would _benefit_ me during my normal work.

So, I told myself that for a week I would only work on my personal 'dotfiles' repository through the `jj` interface.
The advantages of this approach were quickly obvious:

Most importantly, it is not a 'production' repository connected with other people.
I could do my own thing on it, mess up and just clone a backup if anything went sideways.[^btrfs]
With that knowledge, whenever the directory would be 'mission-critical' again
(i.e. I actually had to go back to doing work instead of tinkering on it)
I could thus switch it out if need be.

[^btrfs]:
    Realistically, I instead used the snapshot functionality of my btrfs volume to drill into the `.git` directory and diff versions between commands.
    I never had to do this for recovery,
    but did it out of interest of how it changes the directory under the hood instead.

Secondly, I know the complete directory and branch structure --
it is a repository I am very familiar with.
This makes it easier to guess at and follow the effects of `jj` commands.
And lastly I was about to work quite a bit on the repository anyways,
so used it as a good time to do the maintenance using a new tool.

Come the seventh day of the experiment, I kept going.
I did not switch back to pure git after the time was up.
In fact, I started migrating more and more repositories to the jujutsu way of doing things.

Now, roughly a month later,
I am doing as much development and writing work as I can on the new tool.

I dread having to go 'back' to git,
with its cumbersome staging index and the sword of commit conflict damocles constantly hanging over operations.

While it is still early, and there _are_ rough edges to `jj` --
not least its development velocity which means breaking changes will still be a regular occurence for a while --
I do not envision myself going back unless forced to anytime soon.

The simple idea of going one level beyond 'commits' as the basic building block into 'changes' (or 'revisions')
makes a world of difference to workflows.

If you are at all interested in smoothing over some of these git-based issues I would recommend taking a look.
Especially also if you are not sure _how_ those issues could be annoying, take a look with a personal or experimental repository.
After playing around with it for a while you will start to notice the stop in workflow in git itself much more than you did before.

## Aliases

To conclude, here are aliases for some of my most-used commands over the last weeks:

```sh
alias jn="jj new" # quickly create new change
alias jna="jj new -A@" # create new change 'after' current
alias jnb="jj new -B@" # create new change 'before' current
```

These three commands are fairly self explanatory.

The difference between a new commit and one 'after' (`-A`) the current working copy is that if there are other
descendants the former will split itself off (i.e. create a new 'branch') while the latter will fit itself in between the current commit and the next commit on the current branch (or ask which one if there's multiple candidates).

Same with 'before' (`-B`).

```sh
alias jc="jj commit"
alias jds="jj describe"
```

The first line is a direct translation of many people's git commit alias.
I have to be honest, however, I have not made use of this alias for `jj` in weeks.

Instead, I use `jds` to quickly describe what the current change does,
or `jds <change-id>` to describe a specific change.

It lets me be much more flexible since I can describe what I am doing at the beginning of working on it
(often in the form of a `WIP: here is what I want to do` line),
change it when it becomes more clear to me what is important as I am working on it,
and finalize before moving on to another change --
or even after already having moved on to another change and just quickly append a little description.

The describe alias together with the three variants of creating a new change already get us quite far in quick
change creation.

```sh
alias js="jj status"
alias jw="jj show"
alias jd="jj diff"
```

These three quickly let me orient myself in the current change,
as I am coming back to a repository or a specific change or branch.

Out of the three, I definitely use `jw` the most often.
It combines the description and diff of all files for the current change, similar to `git show`.

In the beginning I though I would make more heavy use of `js` since that was perhaps my most used git command,
but with the omission of the staging index phase for each commit,
I have honestly used it very little.

`jd` I mostly use to have an overview of longer-running changes throughout a file or directory.
By doing `jd --from <change-id> --to <change-id>`[^jdshort] I can survey the changes of a whole branch,
a specific length of time of commits,
or even compare two branches which for example attempt different solutions.
By using `jd --from <id> --to <id> filename/dirname` we can further restrict it to show only specific changes throughout.

[^jdshort]: Though I use of course the shorter forms `jd -f <id> -t <id>` in normal shell operations.

Let's get to some of my most used aliases for changing the history:

```sh
# for squash-and-go workflows
# https://steveklabnik.github.io/jujutsu-tutorial/real-world-workflows/the-squash-workflow.html
alias jss="jj squash"
alias jsi="jj squash --interactive"
```

The 'ideal' form of work for me.
I check out a new change with `jn`,
quickly describe what I want to do with `jds`,
and, once I am done merge it as part of a larger change using `jss`.

```sh
# for describe-and-edit workflows
# https://steveklabnik.github.io/jujutsu-tutorial/real-world-workflows/the-edit-workflow.html
alias je="jj edit"
alias jen="jj next --edit"
alias jep="jj prev --edit"
alias jenn="jj next"
alias jepp="jj prev"
```

These support the 'alternative' proposed workflow which I thought I would make more heavy use of.
However, with the exception of `je`, I rarely remember I have these aliases set,
mostly using them to quickly jump to the previous change, do some work,
and jump back with `jep; <work-work-work>; jen`.

`je`, however sees very heavy use in my normal work.
I jump all over the place with it, in combination with the nice `jj log`.

In fact, I probably use it _too often_ to jump between commits,
as, for example if I jump back to an old change to amend it,
I will often use `je <id>` and do some work instead of `jn <id>` or `jna <id>` to be on the safe side of editing a new commit and then squashing (with `jss` presented above).

Thus, the real heroes:

```sh
# oops buttons
alias ju="jj undo"
# allows you to split the current change into multiple
alias ji="jj split"
# quickly get rid of a change
alias jab="jj abandon"
```

It is such a pleasure to have access to an 'I messed up' button at any point.
Made an error, any kind of error, just hit `ju` and forget all about it.

Similarly, as mentioned above I will often jump to a point in my repo,
do some edits and forget that I am on another change which does not have anything to do with it.
I will just fire up the `ji` alias which allows me to quickly pick which things I want in one commit and which in another --
essentially splitting my change in two --
and describing the new changes instantly.

```sh
alias jrb="jj rebase"
```

Together with the above splitting access to quick rebases make it a joy to rewrite history.
Aside from an interactive rebase to rewrite or reorder individual commits,
I never rebased too much in git itself.
It always seemed cumbersome and often resulted in dozens of conflicts.

Nowadays I am rebasing left-and-right with `jrb -r <change-id> -d <where-to?>`.
It is quick and painless to reorder past changes and make them make more sense.

Another big use I get out of it is `jrb -b <any-change-in-branch> -d <where-to?>`
to rebase a whole branch from its divergence point onwards,
perhaps most similarly to git.
Less often used but still sometimes very nice to have it the `jrb -s <change-id-and-descendants> -d <where-to?>`
'source' rebase,
which rebases the targeted change and all its descendants (but not ancestors) somewhere.

This allows relatively painless branch splitting if I find I am working on two divergent features on a single branch for example.

```sh
# 'branching' bookmark work
alias jb="jj bookmark"
jbm() {
    jj bookmark set -r "${1:-@}" main
}
# remote work
alias jrv="jj git remote list"
alias jp="jj git push"
```

Lastly, some remote work aliases.
I should come clean and confess that I have not used jujutsu extensively for collaborative repositories yet.
Most of my focus has been on understanding how the workflow of anonymous branches filters back into operating with git remotes.

Here are some of my answers.
The `jrv` alias is a direct copy of my `grv` alias for git,
giving me information about all remotes at a glance.
Similarly for `jp`.

`jbm` allows me to quickly set the 'main' bookmark to my current change,
or any change I point it to.
I am using this to quickly ensure that I am pointing the main branch to the correct change if I intend to push it.

```sh
# revset info
alias J="jj log -r 'all()'" # mirror default command being log
alias jl="jj log -T builtin_log_oneline"
alias JL="jj log -T builtin_log_oneline -r 'all()'"
alias jlo="jj log --summary -T builtin_log_compact_full_description"
alias JLO="jj log --summary -T builtin_log_compact_full_description -r 'all()'"
alias jloo="jj log --patch"
alias JLOO="jj log --patch -r 'all()'"
alias jol="jj op log"
jlf() {
    jj log -r "description(substring-i:\"$*\")"
}
jlof() {
    jj log --summary -r "description(substring-i:\"$*\")"
}
jloof() {
    jj log --patch -r "description(substring-i:\"$*\")"
}

# show branches (i.e. head commits) w a couple previous commits
alias jh="jj log -r 'ancestors(heads(all()), 3)'"
```

Finally, a long list of `jj log` setups.
It again mimics my git setup, in that I can quickly call up a `jj log` which grows in detail the more `o`s I add to the command.
So, `jl` displays minimal information at maximum density, `jlo` displays summary changes, `jloo` complete diffs.
The same goes for their uppercase variants `JL`, `JLO`, `JLOO`, only that they display _all_ changes.

So far I only rarely had to use the opslog (somewhat akin to the reflog in git),
but the alias is there with `jol` if I need to reach it.

The find aliases are extremely useful to me.
When I invoke `jlf jujutsu` it shows me all commits in which I talked about jujutsu.
I often use it to find `WIP: Description` commits for example, simply by doing `jlf wip:`.
They follow the same expanding detail as the others with additional `o`s logic.

And finally, `jh` lets me quickly orient myself on existing branches,
whether named or anonymous.

These are some of my current jujutsu aliases.

Having only used the application for a few weeks these are bound to change,
as I get ever more used to its paradigms and settle on my workflow.

But they may be useful to you or others,
and even if they are not I would still urge you to check out jujutsu as your version control software.
Otherwise, you may not even know what you are missing.
