---
title: Push to all jujutsu remotes at once
description: Creating a git and jujutsu multi-remote push alias
pubDate: 2026-08-22T08:02:30
tags:
  - git
  - jujutsu
weight: 10
---

I keep most of my repositories on more than one remote -- generally my main
personal forge and a backup mirror or collaboration invitation on GitHub.
Typing a push for each got old fast, so a while ago I taught git a tiny trick:
one command that pushes to every remote it can find.
I documented this general workflow a few years back as part of working on
[GitHub and Forgejo/Gitea in tandem](2023-08-26-splitting-forges).

Since jujutsu has been slowly taking over my git workflow in recent months, I
obviously wanted the same comfort there too.

What I'll cover today:
what the alias looks like in git, what it looks like in jj, and the two little
differences between them.

## Git: let the shell do the looping

Git has no built-in "push everywhere", but since its aliases happily run shell
commands, we can get close enough.

Two lines in your git config:

```gitconfig
[alias]
    pushall = "!git remote | xargs -I R git push R"
```

`git remote` lists the names of your remotes, `xargs` runs `git push R` once per
name, and whatever `push.default` decides determines what gets sent.
Simple change and quick win.

## Jujutsu: same idea with a slightly different shape

Jujutsu generally keeps the repository as plain git underneath, so your remotes
carry over untouched -- but git aliases do not, and as far as I know there is
still no native way to push to several remotes at once here too.

Of course if you are in a git co-located repository you can use the git alias we
just created above, but mixing git and jj commands can be confusing since both
have different understandings of where the `HEAD` points and what is committed.
Ideally, we just recreate exactly the same functionality for jujutsu.

`jj git push --remote` takes exactly one name, period.[^single-remote] Fine, we
loop again.

[^single-remote]:

The maintainers mention this themselves in the `jj git push` help page:
it takes a single `--remote` option, there is no option to push to multiple
remotes.
I believe them, I certainly did not find one - but be aware that jujutsu is
still evolving _rapidly_.
What is true today may not be true when you read this, so take a look through
the `jj --help` pages.

Three small differences make the command look different from its git cousin:

1. `jj git remote list` prints the name _and_ the URL per line, plus a push URL
   in parentheses if one is set -- so the names need trimming (`awk '{print
   $1}'`) before they can be fed onward.
2. Where git prefixes external commands with `!` for its aliases, jj currently
   recommends calling the `jj util exec` jj-internal command which in turn
   executes external commands.
   A bit verbose, but doable.
3. jj aliases are not free-form shell strings but argument lists, so we have to
   invite bash ourselves.

Put these ideas together in `~/.config/jj/config.toml`:

```toml
[aliases]
pushall = ["util", "exec", "--", "bash", "-c", "jj git remote list | awk '{print $1}' | xargs -I R jj git push --remote R"]
```

Now `jj pushall` can perform exactly the same dance as its git ancestor.
Neat!

One thing worth knowing:
unlike bare `git push`, a bare `jj git push --remote R` already pushes every
changed tracked bookmark to that remote.
That means, on the one hand there's no refspec fiddling required, but on the
other you should be aware that _all_ your remotely tracked bookmarks will be
pushed at once.
To my brain this feels exactly like what should happen, but still a tripwire to
make yourself aware of the first couple times before pushing.

A remote with nothing new answers `Nothing changed.` and exits happily, so one
sleepy mirror cannot abort the whole round trip.
If you would rather stop at the first 'failure', a plain loop works just as
well:

```toml
[aliases]
pushall = ["bash", "-c", "for r in $(jj git remote list | awk '{print $1}'); do jj git push --remote \"$r\" || exit 1; done"]
```

Both variants of course also work repo-locally in `.jj/repo/config.toml`, if you
only want the behavior for one project.

Lastly, since `jj --version` 0.42.0 (released 2026-06-04), your aliases can take
a new table form with a `description` field, so you can even provide a
description which appears in the shell completion and makes your alias appear
like a native command.
If you are running such a newer jujutsu version, use this variant:

```toml
[aliases]
pushall = {
    definition = ["util", "exec", "--", "bash", "-c", "jj git remote list | awk '{print $1}' | xargs -I R jj git push --remote R"],
    doc = "Push to all remotes at once"
}
```

## What about fetching

I left fetching (the `git pull` equivalent) out of this entirely.
Amusingly enough, fetching from several remotes is something jj supports out of
the box -- `git.fetch` accepts a whole list of remotes, and you can call `jj git
fetch --remote=origin --remote=my-random-fork` with as many remotes as you wish
-- while pushing remains stubbornly one-at-a-time for the moment.

Perhaps some day both directions get symmetric treatment, but until then the
loop stays in my config.
There is some discussion towards a
[multi-remote push feature here](https://github.com/jj-vcs/jj/issues/7833).

Thank you for reading, I hope you enjoyed!
