---
title: Migrate tasks from taskwarrior to dstask
description: Fixing the import process on dstask-import
pubDate: 2025-06-22T17:10:35
tags:
  - taskwarrior
weight: 10
---

The following is just a quick tip on how to correctly migrate your taskwarrior tasks to [dstask](https://github.com/naggie/dstask),
without errors and losing as little context as possible.

I like to try out alternative productivity solutions every now and again,
and dstask is very tempting.
It boasts a clean golang command line interface and, especially interesting to me,
a sane task backend consisting of plain yaml files.[^yaml-backend]

[^yaml-backend]: A backend which makes git integration easy, allows much better integration into a unix-like ecosystem than a self-made database, and even gives you the option to just handle your tasks with plaintext software.

dstask provides in nice [executable](https://github.com/naggie/dstask/releases/tag/0.27) called `dstask-import` to directly import tasks from github issues or taskwarrior.
I have not tried the GitHub integration yet, though to me it is one of the tempting pieces of the software.[^gh-integ]

There is a small 'migration' [guide](https://github.com/naggie/dstask/blob/master/doc/taskwarrior-migration.md) on the dstask repository,
but it seems to not go far enough in explaining how to achieve complete migration.

[^gh-integ]: You can achieve similar integration in taskwarrior using the venerable bugwarrior plugin software,
and it works very reliably. It is also another puzzle piece and something to set up which could be avoided with this simple importer.

## Workflow

Here are the two steps:

```sh
# Export your full taskwarrior database
task export > tw.json
# Import the data in dstask
cat tw.json | dstask-import tw
```

And already done.
If you intend to accomplish this in a single step it can of course be shortened to a pipeline:

```sh
task export | dstask-import tw
```

This seems like a nice and quick path to victory,
but in my case it currently only gives an error message:

```sh
failed to decode JSON from stdin
```

## Troubleshooting

After some back-and-forth I figured out the issue in my case:
Any taskwarrior tasks with dependencies declared would trip up the import.
In a way it makes sense since as I understand dstask does not support task dependencies,[^dependencies]
but it would nevertheless perhaps be nicer if it did not fail with a less than stellar error message.

[^dependencies]: At least, they are still listed as an idea, or wish, in the [FUTURE](https://github.com/naggie/dstask/blob/master/etc/FUTURE.md) file of the repository. That makes me think they are indeed not part of the present of the tool.

To fix the issue there are two approaches and both will lose you information:

1. Nuke any task with dependencies. This of course loses those tasks completely,
but it can quickly tell you if dependencies truly are at fault for the broken import or there is something else happening.

   Simply remove any line from the exported json which contains `"depends":` in whatever your method of choice.
  For my testing I opened the file in vim and quickly ran the command `:g/"depends":/d` which removes them all in one go.
  Having done so, I could now successfully import the file into dstask.

   However, this obviously loses quite a bit of information, over 100 tasks in my case,
  so the other option is:

2. Remove the 'depends' fields themselves without losing the complete task.

   For this, you can again choose your preferred method,
   depending presumably on the regex engine you are most comfortable with.

   For the sake of completeness, here is the respective command for vim again: `%s/,"depends":\[.*\],/,/`
   This presumes that the 'depends' field is never the last in the chain of fields
   (as in my exported file it was always succeeded by the urgency field), nor the first.

Having done so it should be possible to import all your tasks normally --
though of course you will lose any dependency relationships between them.

This is just a quick fix to improve the migration scenario between the two tools and hopefully the [issue](https://github.com/naggie/dstask/issues/171) will be fixed at some point,
either by dstask adding support for dependencies or ignoring them from taskwarrior exports.

I have not delved too deeply into understanding and testing out dstask itself,
so I cannot speak with any authority on the utility of the tool.
But until then, this fix should make it easier to investigate an intriguing alternative tool yourself if you are coming from taskwarrior.
