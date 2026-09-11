---
title: The context prompt
description: Display your taskwarrior context in the starship shell prompt
pubDate: 2026-09-27T11:55:39
tags:
  - taskwarrior
  - commandline
weight: 10
---

The following is a short interlude between proper posts on mapping the GTD
methodology onto taskwarrior.

## Figuring out where we are

In a previous part we gave my taskwarrior setup _contexts_ -- named views that
filter everything down to "what can I do right here".
They work well.

They also have a failure mode I ran into within days:
_forgetting that one is active_.
You switch into `work` mode on a Monday, get absorbed and come up on Thursday
wondering why half your list mysteriously vanished.
The lens is doing its job; I just could not see that I had the lens on.

In my case, the obvious home for that bit of state is the shell prompt -- the
one piece of screen I stare at more than any other.
I use the [starship](https://github.com/starship/starship) prompt.
It displays fast, works relatively well across shells (I have it running on zsh,
bash and nushell) and is endlessly customizable.
So all the following implementation will be base on configuring the starship
prompt to display our current taskwarrior context.

This post records the two implementations I went through, and why for me the
second one won.
It is a small story, but its underlying idea generalizes nicely:
always try to move the expensive question from where it is asked often to where
it is asked rarely.

## Version one: just ask

Taskwarrior can simply be asked which context is active:
`task _get rc.context`.
To take this and transfer it into a custom component for the starship prompt,
add the following into your starship configuration file, usually
`~/.config/starship.toml`:

```toml
[custom.task_context]
command = 'c=$(task _get rc.context); [ -n "$c" ] && echo " $c"'
style = "cyan"
```

Starship's custom modules run a shell command and splice its output into the
prompt.
Then add the module itself into the list of displayed modules in the same file.
For example, to add it into the right prompt:

```toml
right_format = """
$cmd_duration\
$hostname\
${custom.task_context}
"""
```

Now your current context is displayed alongside the last command's duration and
the current hostname.

This version is honest, stateless, and correct -- and after a day of use I hated
it.
Prompts redraw constantly:
every Enter, every Ctrl-C, every failed command.

And each redraw pays for a full taskwarrior startup.
I measured roughly half a second per query on my development container; faster
on real hardware, I presume, but still very much the slowest kid on the prompt,
and prompt latency is one of those things you cannot un-feel once you notice it.
Additionally, this latency only gets _worse_ the more your taskwarrior harness
does -- every hook, listing, redraw and so on will add precious milliseconds to
your prompt draw time.[^timing]

[^timing]: Prompt timing measured with a stopwatch-grade benchmark script, not rigorous
benchmarking -- but half a second is half a second, however you time it.
Most of the time comes from my git-backup hook which exports all taskwarrior
tasks, writes them into an ordered json file and commits that to a git VCS
repository which takes a moment.

Verdict:
completely correct, and unfortunately unusably slow in my case.
Test it out on your end, perhaps it is fast enough and you can call it a day
already.
In my case, I'll go a step further.

## The inversion

After pondering it for a bit, here is the thought that fixed the speed for me:
I invoke taskwarrior deliberately maybe fifty times a day, but my prompt redraws
hundreds of times.

So stop asking at prompt time entirely.
Instead, ask _once per task invocation_ -- somewhere the invocation cost already blends
into a startup I accepted by choosing to run `task` -- and write the answer down
for everyone else to grab.

Essentially, we cache the current context in the user environment.
That is a textbook job for a taskwarrior `on-exit` hook, sitting next to my
existing git-backup hook:

```sh
#!/usr/bin/env sh
# Caches the current taskwarrior content into a file for other appliactions to
# have fast access without having to invoke the taskwarrior executable.
# Writes to user's .cache/task dir by default.

# forkbomb safety guard
if [ "$DISABLE_HOOKS" = "true" ]; then
  exit 0
fi
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/task/context"
mkdir -p "$(dirname "$CACHE")"
ctx=$(DISABLE_HOOKS=true env task _get rc.context 2>/dev/null)
if [ "$ctx" != "" ]; then
  echo "$ctx" >"$CACHE"
else
  rm -f "$CACHE"
fi
```

The three details worth calling out, since they are the whole design:[^hooks]

[^hooks]: Hooks live in the taskwarrior data directory and are committed right along with
my tasks by the backup hook, so this script travels wherever my tasks go.

- The invariant idea:
  the cache file exists _if and only if_ a context is active.
  Empty result means delete the file, we never leave a stale zero-byte file
  behind.
- The recursion guard:
  the hook itself calls `task _get`, which fires hooks again, which call
  `task`...
  the `DISABLE_HOOKS=true env task` prefix plus the guard at the top break that
  loop before it becomes a fork bomb.
- The latency cost now moves:
  one extra `_get` per explicit `task` command, where it disappears into startup
  latency I was paying anyway.

## Version two: read the note

With the invariant in place, the prompt side becomes trivial:

```toml
[custom.task_context]
command = ' cat /home/marty/.cache/task/context'
when = ' test -f /home/marty/.cache/task/context'
format = "[ $output]($style) "
style = "cyan"
```

Reading a ten-byte file costs effectively nothing; the prompt is back to full
speed.
Neat!

The more subtle part is why the additional `when` call is useful here at all.
Starship hides a custom module when its `command` outputs nothing _or_ exits
non-zero -- _but_:
any literal text you put in `format` renders regardless.

My format carries a static icon next to `$output`; with a naive `when = true`,
an inactive context would leave me a ghost icon with no name beside it, forever.
So the `when` line gates on the file's existence, and the icon only appears when
there is a name to accompany it.[^nu]

[^nu]: A confession in the footnotes:
the `command` half is deliberately written with plain `cat`, which reads the
same in every shell I touch -- bash, zsh, nushell.
The `when` half still leans on POSIX `test`, which nushell does not know.
As far as I can tell that leaves the indicator hidden under nu for now; with
intermittent nu use I have decided to live with it rather than contort the
config, but it remains the one seam I would patch first if it starts to itch.

## Things I did not do

- Query the TaskChampion database directly from the prompt:
  One less moving part in theory -- but I have not verified the settings schema,
  it drags a `sqlite3` dependency onto my prompt path, and it is still orders of
  magnitude slower than reading a file.
  Was an idea for a bit, but ultimately this is much easier to reason about.
- The cache is per-machine, and I sync task data between devices; a context
  switched elsewhere lingers here until my next local `task` run.
  Given how often that is, the staleness window is minutes, so this is entirely
  acceptable to me.
- Anything fancier, like a hotkey widget to switch contexts from the prompt.
  Tempting someday-project but zero daily pain today.

## Resources

- [Starship custom modules](https://starship.rs/config/#custom-commands) -- the
  hiding semantics that make the `when` line necessary
- [Taskwarrior hooks](https://taskwarrior.org/docs/hooks/) -- `on-exit` and
  friends

Thank you for reading!
May your prompt be fast and your lenses visible.
