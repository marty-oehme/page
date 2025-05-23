---
title: Jujutsu WIP experiments
description: Rebasing, experimenting on and avoiding pushes of unfinished changes
pubDate: "2025-05-22T14:47:15"
tags:
  - jujutsu
weight: 10
---

When I work on code or prose, especially for personal projects such as my blog, my dotfiles, or little side projects,
I often leave a big trail of little experiments in my wake.
Part of why I am working on projects like these is the 'learning factor',
trying out new things, seeing what works,
and how I can improve myself and the things I write.

Over time, the experiments often get lost in code branches or buried in changes over time.
Often that is completely fine.
But other times, you want to recall an old experiment or continue working on it.

Additionally such experimental changes, while they are fresh, should be clearly marked as such,
so that they do not end up in any 'production' code, or whatever the equivalent may be for your more personal repositories.

For this, 'WIP changes' are a nice way to (often informally) keep a coherent overview of changes which you
worked on or are currently working on,
but should be differentiated from your normal code progress.

## Working with WIP changes

'WIP' commits are, at their core, normal commits which clearly _signal_ their own incompleteness.
Generally, they do so simply by being prepended, e.g. with `WIP: My commit headline`.
It's a convention that for example GitLab use to mark [Merge Requests](https://about.gitlab.com/blog/feature-highlight-wip/) which are not yet ready,
and GitHub has somewhat adopted the ideas for [incomplete Pull Requests](https://github.blog/news-insights/product-news/introducing-draft-pull-requests/).

Of course there are other ways of documenting the status of your changes
(whether they are encapsulated in a commit, PR or whichever format).
The `WIP:` form is just one of multiple, somewhat standardized ideas, that speaks to me for its simplicity.[^other-forms]

You craft your commit as usual and simply remove the prepended `WIP:` once you are happy with it and believe it to be ready for use.
But until then the prefix is a reminder that whatever change hides behind it is _not_ ready for being included in the trunk.

The people being reminded can often even include yourself,
if you leave work for the day and want to make sure you remember the thing last worked on next time,
or if you, like mentioned above, are working on multiple small experiments at once.

[^other-forms]: Other forms I have seen used here and there are `[WIP] change
    headline` or having a long-form description like the following:

    ```gitcommit
    feat: Add an amazing feature

    status: WIP

    Here be a description.
    ```

    The advantage of having the WIP declaration directly in the headline of the commit message
    is that it will show everywhere in a very visible way, including single-line logs.

## Avoiding accidental remote pushes

You want to have easy access to your changes but ensure they don't end up with other people or your final project.
Jujutsu makes it easy to work with `WIP` changes locally without having to worry about where they end up.

```ini
[git]
private-commits = "description(glob-i:'WIP:*') | description(glob-i:'PRIVATE:*')" # refuse to push WIP commits
```

Put the above into your `~/.config/jj/config.toml` file (or your project-local configuration file at `.jj/repo/config.toml`).
One of the nicest little features of jujutsu is that it has this built-in as a simple option and it is so flexible.
I have added a second description to the above just to show how you can combine multiple different patterns.

Like magic, all your `WIP` changes will refuse to leave your machine.
Simply adjust the commit to whatever you do _not_ intend to have end up in remote repositories.
You can make use of the full power of jujutsu [revsets](https://jj-vcs.github.io/jj/latest/revsets/).

Want to have all `WIP` changes under some form of a `wip/` bookmark?

```ini
[git]
private-commits = "bookmarks(regex:'^wip/')"
```

Anything commited under a bookmark like `wip/some-new-feature` or `wip/big-experiment` will never be pushed.

## Finding all WIP changes

If you ever want to list all your previously worked on changes, jujutsu makes that easy as well.
Use a regular expression to find all working commits at once:

```sh
jj log -r 'description(regex:"^WIP:")'
```

The same revset as above, only this time we ensure that it only targets changes which _start_ with `WIP:`.
This avoids showing changes which may have the phrase somewhere in the middle of their message.

You can of course use this function in the `private-commits` option above as well if you wish to only keep those commits locally as well.

## Updating old WIP changes

Here's an operation that is a little more advanced --
but made very simple once again by jujutsu.

If you want to update all WIP changes in one fell swoop,
perhaps you want to keep working on one or more in your new codebase state,
or just see where a lot of conflicts are created.

You can make use of the same revset function as above to rebase them all wherever you want:

```sh
jj rebase -r 'all:description(regex:"^WIP")' -d main
```

This takes _all_ the commits marked by the `WIP:` prefix and rebases them to your main trunk,
though of course they can receive other destinations such as your current working change with `-d@` instead.

Made a big mess of things?
As always a simple `jj undo` is there to quickly undo the last operation.

## Conclusion

This workflow, of course, is not revolutionary.

But jujutsu allows you, similar to other more advanced operations,
to weave in and out of your changes in a way I have never felt comfortable using just git alone.

While I don't want to attribute too much to the change of my main version control tool
I have to admit that it feels so nice to just be able to work on one experiment, or two, or five,
at one point,
drop them,
and pick right back up where I was whenever I get around to it.
And I can work on them simultaneously with multi-parent changes.

I hope these small tips give you some motivation to use jujutsu for marking `WIP` changes
and encourage you to experiment more with your code, words and ideas.
