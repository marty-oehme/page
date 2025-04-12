---
title: Ad-hoc Process end notifications
description: Always be in the know when long-running processes end
pubDate: "2025-04-12T12:50:08"
tags:
  - commandline
  - linux
weight: 10
---

It happens more often than I would like to admit that I start a process on the command line which takes (significantly) longer than I anticipate.

Be that copying data from one location to another,
cleaning, defragmenting or balancing a filesystem or,
as in my most recent case, shrinking a large filesystem partition down to occupy less space.

Turns out some of these programs do not provide any progress output by default (or at all),
and even if they do -- that does not help when you are not at your workstation anymore.
Additionally, I often start these processes _before_ fully thinking through how long it may take,
or get called to another unplanned appointment.

## Quick notifications

In all of these cases the easiest solution is to just let it run,
do it's thing and then notify me when everything is finished.

But a) how do I get notified and, more importantly,
b) how can I make sure this happens when the process _is already running_?

As for the former, you can use whatever measure you think best for you.
Send an email to yourself with `sendmail`,
just display a system-wide notification with `notify-send`,
or play a loud sound with whatever media player works best (e.g. `ffplay`, or `mpv`, or just plain `pw-play` if using pipewire).

In my case since I already have it set up on my phone (by essentially just installing the app),
I am almost always using the venerable [`ntfy.sh`](https://ntfy.sh) for cases like these:
it is super simple to send out a quick message with e.g. `curl`,
it will always inform me on the phone so I notice even if I am out and about,
I can monitor from the workstation itself with the [web app](https://ntfy.sh/app),
and it just plain _works_ without any fuss.

So that will be the way to be notified.
But how can we accomplish this while the process is already started?

## Adhoc polling injection

We will assume that the process we want to monitor is one where a specific program is running for a long time,
and when it is finished the program process is also stopped.
For other cases you will have to find other conditional catchers, but the basic idea stays the same.

That idea being to poll every X seconds on the existence of the process,
and notify us as soon as does NOT exist anymore.

Here is a basic mockup:

```bash
while true; do
    ps aux | grep process && echo still running || echo NOT RUNNING ANYMORE
    sleep 10
done
```

We have created: a basic `while` loop running forever (while true);
which lists all the processes on the machine, greps for the target process and lets us know if it is still running or stopped.

From this basic formula we can adapt each part to our liking.
Want to not display anything at all while the process is running? Get rid of the positive conditional side (`&& echo still running`).
Want to inform the user _while_ the process is running and not while it is stopped? Get rid of the negative conditional instead (`|| echo NOT RUNNING`).[^shellcheck-conditional]

[^shellcheck-conditional]:
    Note that technically this is _not_ a correct if-then-else conditional. There are situations where we run the third branch (else) even if the condition is true.
    See [this](https://www.shellcheck.net/wiki/SC2015) shellcheck wiki page for more explanation. Since the pattern lends itself so well to quick one-off cli scripts I am often still using it, aware of the possible pitfalls.
    To ensure complete correctness change the conditional into an actual if-then-else-fi bash conditional, like described in the wiki page.

Want to send yourself a note through ntfy like I do? Change the second `echo` to `curl -d "PROCESS ACCOMPLISHED" ntfy.sh/my-unique-channel`.

Change the sleep timer to an amount of seconds that work for your use-case --
if there is not urgency something like every minute with `sleep 60` should suffice.

For process grepping, there are a few things to keep in mind:
If running a process called `grep my-process-name` it can find itself when grepping for the `my-process-name` since the grep is also running as a process.
If looking for a process which is relatively general (say, copying data between directories with `cp`) we may have to ensure that we find the right _instance_ of the command being run.

Both can be done by being more precise in the grep pattern itself.
Since I personally really use this polling template in a very ad-hoc way,
I often run `ps aux | grep <general-name>` once and look at the output.
Then I just copy a unique-looking bit of the process line and paste it into the grep.

For example, say I want to be notified once the resizing of a filesystem is done:

```bash
while true; do ps aux | grep -q "[r]esize2fs" && echo "$(date)" running || curl -d "RESIZE DONE" ntfy.sh/my-channel sleep 60 done
```

Let's review the components, starting from the back:

Since this is a process which I expect to run for a few hours, it completely suffices to check every minute (`sleep 60`).

I like to be `ntfy` notified, so I curl to a channel that I have set up (`|| curl -d "RESIZE DONE" ntfy.sh/my-channel`, see ntfy [documentation](https://ntfy.sh/docs)).

On the other hand, I also like to check every now and again that everything is still working smoothly _while_ the process is running,
so I also add in an echo on the positive conditional side (`&& echo $(date) running`)
By adding a `date` before the string we basically timestamp the echo so I know when something may have went wrong (can also use the `ts` command instead).

And finally, we have the actual search for the command (`grep -q "[r]esize2fs"`).
The `-q` option tells grep not to output any results but simply give a positive exit code (0) when it found something or negative (1) if not,
which allows the conditional to function in the first place.
The grep pattern is a clever bit of trickery which returns all results of the process itself,
_without_ our grep for it.[^greptrick]

[^greptrick]: See [this](https://unix.stackexchange.com/a/74186) stackoverflow answer for more details. Essentially since our grep command has more characters which it is not looking for we make it ignore itself. Quite neat.

## Remote capabilities

Since our conditional is a normal shell command like any other,
this even works through ssh on remote machines,
provided you have an ssh key and ssh agent set up.

It will, however, establish a new ssh connection on each loop so it is not the most resource friendly approach,
and might even get you banned on some machines running e.g. `fail2ban` for repeatedly hitting the login - so be aware of the risks.

But since you can execute any command directly through ssh by simply passing it along with the command and target, we simply throw ssh into the mix and everything works just as before:

```bash
while true; do ssh user@remote-machine ps aux | grep -q "[r]esize2fs" && echo "$(date)" running || curl -d "RESIZE DONE" ntfy.sh/my-channel sleep 60 done
```

Everything stays the same, we just invoke it through ssh.
Honestly, one of the reasons I celebrate working on the command line as much as I do --
the ease with which I have moved from looking into the local machine in front of me to one that may be tens, hundreds or thousands of kilometers away is just staggering
(Try doing that quickly without a very specific GUI).

There are presumably ways of improving this `ssh`-enabled command --
keeping the connection alive and repeating the command that way for one --
but since we are still in the territory of ad-hoc glue scripts,
I do not give much priority to it.

In this case, if it works it works, and if we don't have to devote too much brainpower to it all the better.
Likewise, there are many other ways of inferring such program progress.
Things like `nethogs` for remote operations,
`iotop` or `dstat` for IO operations,
or even simple `top` and `htop` for process status and system usage.

But for my use cases (being forgetful before starting processes primarily) the above little one-liner has nevertheless been so useful time and time again.
