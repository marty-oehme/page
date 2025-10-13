---
title: Nushell Popcorn analysis
description: Learning data pipelines in nushell
pubDate: 2025-11-20T18:10:07
tags:
  - nushell
  - analysis
weight: 10
---

<!--toc:start-->
- [Loading the data](#loading-the-data)
- [Weekly rhythm](#weekly-rhythm)
- [Kernel longevity](#kernel-longevity)
- [Top packages](#top-packages)
- [Conclusion](#conclusion)
<!--toc:end-->

A little while ago I have been experimenting with the [`datalad`](http://datalad.org) program in order
to create recreatable and traceable datasets to work with in data analysis.

One of my learning projects resulted in the creation of
[`ds-voidlinux-popcorn`](https://git.martyoeh.me/datasci/ds-voidlinux-popcorn),
a dataset taking the statistics from
[voidlinux popcorn](https://popcorn.voidlinux.org/) and transforming them into
an easily parseable csv-based dataset.

The data show daily statistics of the [Void Linux](https://voidlinux.org/) repositories,
with unique daily users, the Linux kernel versions present,
and individual package installation break-downs.
I used the data for some further analysis,
the result of which is a long-form article which will hopefully be published here soon.

But I also thought --
until then --
let's have some further fun learning while we're at it,
and do a little exploratory data analysis with [`nushell`](https://nushell.sh).

In a nutshell, nushell is a unix-like shell environment which transports
structured data through its pipes, making some data exploration processes
relatively painless which were much more involved more traditional shells like
`zsh` or `bash`.[^powershell]

[^powershell]: In a way, `nushell` combines the concise syntax and movement concepts of unix-y
  shells like `bash` with the internal data model concepts of `powershell`, while
  giving it all a little sheen and gloss.

While working with `json` data in a shell directly traditionally required
calling out to external programs like [`jq`](https://github.com/jqlang/jq) or
[`ijq`](https://sr.ht/~gpanders/ijq/), [`yq`](https://github.com/kislyuk/yq) or
[`zq`](https://zed.brimdata.io/docs/commands/zq), with `nushell` this is all
handled internally, exposing the same data selection and filtering interface to
you whether you work with `json` files, `csv` or `tsv`, `yaml` or `toml`, or an
increasing number of additional formats handled through
[plugins](https://github.com/nushell/awesome-nu).
For any of these formats, simply `open` a file, or pipe data into a `from`
command, and nushell creates a data structure it understands out of it --
usually a table.

At the same time, the language and underlying (functional) approach to `nushell`
is radically different from traditional shells, so it takes some time to
re-learn the syntax and mental models required for fast and flexible data
analysis.

Which is where we circle back to the purpose of this article:
let's take the data I prepared and run it through some `nushell` functions to
explore and learn about both at the same time.

Note:\ I am by no means an authority on `nushell` or functional programming.
In fact I cobbled many of the following examples together from other people's
samples, the [`nushell` book](http://www.nushell.sh/book/) and the official
[cookbook](http://www.nushell.sh/cookbook/).
If I made a mistake anywhere or there are better ways to accomplish what I did
_don't hesitate_ to reach out and let me know!

## Loading the data

Since the data exists in a `datalad`-prepared dataset as `csv` files, this makes
it easy to integrate into my new analysis.

For my purposes, I'll simply create a new `datalad` (dataset) project.
If you don't have the program installed, you can use a temporary version with
the `uv` python package manager, by substituting the `datalad ...` command in
any of the below code snippets with `uvx datalad ...`.[^datalad]

[^datalad]: Using `datalad` is not strictly necessary to get at the actual data but it does make it easier.
  Basically the program is a wrapper around `git-annex` which takes care of some
  of the plumbing to let you concentrate on the data analysis itself.
  Any of the below operations can also be accomplished with `git` and `git-annex`
  commands, but I am not exploring those as `datalad` is not the focus of the
  article at hand.

Then we can simply clone the existing dataset as a _sub_-dataset into this new
project, and download the whole output directory from it.

```sh
datalad create -c yoda analysis-popcorn-nushell
cd analysis-popcorn-nushell
mkdir input

datalad clone --dataset . https://git.martyoeh.me/datasci/ds-voidlinux-popcorn input/popcorn
```

The `input/` directory creation and path cloning is not necessary, I just like
to have any input data for the current project inside a directory named
`input/`, and any output data (unsurprisingly) in a directory named `output/`.
If you'd like you can clone the dataset just as well into the repository root
instead.

Lastly, we have to actually _grab_ the data (so far we only cloned pointers to
the actual files) so we can work with it locally:

```sh
datalad get input/popcorn/output/*
```

This may take a moment, as the dataset is currently a couple hundred MB in size.
Now we are ready to take a look with `nushell`:

```nu
open input/popcorn/output/files.csv | first 5
```

This should show you a table with 5 rows of the files contained in the 'raw'
popcorn dataset, along with their filesize and last modification time.[^firstfive]

[^firstfive]: For your analysis of course it will makes more sense to work on the full file, I am just restricting it to the first five for easier display in this article. For the more involved data grouping below, I often switch to the full file as well.

| date | filename | mtime | filesize |
| --- | --- | --- | --- |
| 2018-05-09 | 2018-05-09.json | 1759244947.9668756 | 6258 |
| 2018-05-10 | 2018-05-10.json | 1759244947.9668756 | 48567 |
| 2018-05-11 | 2018-05-11.json | 1759244947.9678757 | 56027 |
| 2018-05-12 | 2018-05-12.json | 1759244947.9678757 | 43233 |
| 2018-05-13 | 2018-05-13.json | 1759244947.9678757 | 52045 |

Let's do a quick few example cleaning steps to dip our toes into the water before moving to more intricate grouping and aggregation steps.

The `date` column is already nicely cleaned to display a simple `YYYY-mm-dd` day format,
but it is still only read as a `string` formatted column.

```nu
open input/popcorn/output/files.csv | first 5 | into datetime date
```

| date | filename | mtime | filesize |
| --- | --- | --- | --- |
| Wed, 9 May 2018 00:00:00 +0200 (7 years ago) | 2018-05-09.json | 1759244947.9668756 | 6258 |
| Thu, 10 May 2018 00:00:00 +0200 (7 years ago) | 2018-05-10.json | 1759244947.9668756 | 48567 |
| Fri, 11 May 2018 00:00:00 +0200 (7 years ago) | 2018-05-11.json | 1759244947.9678757 | 56027 |
| Sat, 12 May 2018 00:00:00 +0200 (7 years ago) | 2018-05-12.json | 1759244947.9678757 | 43233 |
| Sun, 13 May 2018 00:00:00 +0200 (7 years ago) | 2018-05-13.json | 1759244947.9678757 | 52045 |

Your display might diverge a bit from mine here now,
but we can see that `nushell` has parsed the string into a full `datetime` type which we can work with much more easily in later operations.
Let's also fix the other columns, starting with `filesize`:

```nu
open input/popcorn/output/files.csv | last 5 | into datetime date | into filesize filesize
```

These are now also nicely recognized as type `filesize` and shown in a more human-readable format:

| date | filename | mtime | filesize |
| --- | --- | --- | --- |
| Sun, 16 Nov 2025 00:00:00 +0100 (4 days ago) | 2025-11-16.json | 1763636518.5792813 | 417.5 kB |
| Mon, 17 Nov 2025 00:00:00 +0100 (3 days ago) | 2025-11-17.json | 1763636518.7392821 | 419.3 kB |
| Tue, 18 Nov 2025 00:00:00 +0100 (2 days ago) | 2025-11-18.json | 1763636518.8012826 | 407.9 kB |
| Wed, 19 Nov 2025 00:00:00 +0100 (2 days ago) | 2025-11-19.json | 1763636519.7272873 | 416.5 kB |
| Thu, 20 Nov 2025 00:00:00 +0100 (14 hours ago) | 2025-11-20.json | 1763636519.874288 | 407.7 kB |

Lastly, let's fix the `mtime` column.
This is a little more involved, as we have the data in a unix timestamp format with sub-second accuracy (everything after the dot).
Since the values resemble a `float` type, it is automatically parsed by `nushell` as such.
Generally useful, but in our case we'll have to do an intermittent conversion step since `into datetime` can only understand `int` and `string` types.

So, here's the final conversion command, taking care of all the relevant columns:

```nu
open input/popcorn/output/files.csv | last 5 |
  into datetime date |
  into filesize filesize |
  into string mtime |
  into datetime --format "%s%.f" mtime
```

| date | filename | mtime | filesize |
| --- | --- | --- | --- |
| Sun, 16 Nov 2025 00:00:00 +0100 (4 days ago) | 2025-11-16.json | Thu, 20 Nov 2025 11:01:58 +0000 (2 hours ago) | 417.5 kB |
| Mon, 17 Nov 2025 00:00:00 +0100 (3 days ago) | 2025-11-17.json | Thu, 20 Nov 2025 11:01:58 +0000 (2 hours ago) | 419.3 kB |
| Tue, 18 Nov 2025 00:00:00 +0100 (2 days ago) | 2025-11-18.json | Thu, 20 Nov 2025 11:01:58 +0000 (2 hours ago) | 407.9 kB |
| Wed, 19 Nov 2025 00:00:00 +0100 (2 days ago) | 2025-11-19.json | Thu, 20 Nov 2025 11:01:59 +0000 (2 hours ago) | 416.5 kB |
| Thu, 20 Nov 2025 00:00:00 +0100 (14 hours ago) | 2025-11-20.json | Thu, 20 Nov 2025 11:01:59 +0000 (2 hours ago) | 407.7 kB |

We have converted all the necessary columns and could now work with them as needed.
In the code snippet above you can also see that we can easily create multi-line commands in `nushell`,
without any of the magic `\`-escaping of more traditional shells.
I will make use of this for the longer commands to follow.

## Weekly rhythm

Looking at the available data, one question that instantly popped into my mind is,
when do most people interact with the repository?

Often, when it comes to download patterns, there are weekend dips or weekday peaks --
in other words, more people interacting during the week than on the weekends.
But since I presume most people have Void Linux running as their personal distribution,
I could see this pattern _not_ being in the dataset as well.

Let's find out!
By looking at the number of unique installations interacting with the repository,
we start by creating a new column which keeps track of the `weekday` of the rows' `date` column.

We can then group the results by the new `weekday` column, and aggregate the number of unique downloads by averaging them.

```nu
open input/popcorn/output/unique_installs.csv |
  into datetime date |
  insert weekday { |row| $row.date | format date "%u" } |
  group-by --to-table weekday | update items { |row| $row.items.unique | math avg } |
  sort -n
```

Lastly, we sort by _numeric_ key (`-n`) and have a table which shows us the average downloads per weekday:

| weekday | items |
| --- | --- |
| 1 | 72.07|
| 2 | 73.35 |
| 3 | 72.97 |
| 4 | 72.99 |
| 5 | 72.55 |
| 6 | 72.79|
| 7 | 72.29 |

Indeed, there is very little variation between the week days (Mon-Fri, 1-5) and the weekends (Sat-Sun, 6-7).
In fact, the only day on which repository interactions rise a little seems to be Tuesday,
which is surprising.

Well, let's corroborate this with my own statistics!
I use [`atuin`](https://atuin.sh/) to track my shell history,
which can be queried with `atuin history list`.

```nu
atuin history list --print0 --format "{time} ||| {duration} ||| {directory} ||| {host} ||| {user} ||| {exit} ||| {command}" |
  split row (char nul) |
  split column " ||| " |
  rename time duration directory host user exit command |
  compact command |
  where command starts-with "sudo xbps-install -Su" |
  into datetime time| insert weekday { |row| $row.time | format date "%u" } |
  group-by --to-table weekday | update items { |row| $row.items | length } |
  sort -n
```

This is quite a bit more advanced of a command, so let's quickly break it down a little.
First, we format the output lines and use them in a null-separated output (to be able to parse multiline history entries).
We can then use this output to split it along the 'nul' separators for finding rows,
and along the custom-inserted formatting markers (`|||`) for finding columns.

```nu
atuin history list --print0 --format "{time} ||| {duration} ||| {directory} ||| {host} ||| {user} ||| {exit} ||| {command}" |
  split row (char nul) |
  split column " ||| " |
```

This gives us a basic table which we can now refine a little:
First rename the columns according to the formatting we just used to give them the same names.
Then we can use the `compact` command to filter out any rows which do _not_ have a `command` column entry
(drop all null-values, essentially),
as this would trip up our row filters later on.[^nullfilter]

[^nullfilter]: And it _did_ trip me up, for quite a while when crafting the pipeline. Now I know the usefulness of the `compact` command, but just for the record: if you ever receive an `cannot find column 'command'` error even if that column should be there, that may mean it contains null values which still have to be filtered. In our case, those rows did not have the column entry since we parsed the 'empty' command earlier. Now I know.

```nu
atuin history list --print0 --format "{time} ||| {duration} ||| {directory} ||| {host} ||| {user} ||| {exit} ||| {command}" |
  split row (char nul) |
  split column " ||| " |
  rename time duration directory host user exit command |
  compact command
```

Now we have a table containing our complete command invocation history --
a very long table, for which displaying may be less mess with another `| first 100` filter or similar.

To see when we updated our system, we can now filter this for any invocation of the `sudo xbps-install -Su` command,
and we'll have all our personal system update commands in a table with their exact dates.
Lastly, we just do the same grouping and aggregation method we already applied to the popcorn history above,
to arrive back at the full pipeline:

```nu
atuin history list --print0 --format "{time} ||| {duration} ||| {directory} ||| {host} ||| {user} ||| {exit} ||| {command}" |
  split row (char nul) |
  split column " ||| " |
  rename time duration directory host user exit command |
  compact command |
  where command starts-with "sudo xbps-install -Su" |
  into datetime time| insert weekday { |row| $row.time | format date "%u" } |
  group-by --to-table weekday | update items { |row| $row.items | length } |
  sort -n
```

By the way, this sort of re-use is exactly one of the positives I envision from my `nushell` usage --
it doesn't really matter whether the data comes from a `json` dataset, `csv` files, or a command output.
As long as you can wrangle the data structure into vaguely similar shape,
you can filter and aggregate using the same standardized commands.

This pipeline leaves us with the following output:

| weekday | items |
| --- | --- |
| 1 | 2 |
| 2 | 19 |
| 3 | 7 |
| 4 | 8 |
| 5 | 5 |
| 6 | 4 |

How interesting --
my personal update usage reflects the little peak we saw for the global dataset _exactly_ on Tuesday,
only much more so.
I am not sure why Tuesday seems to be my preferred update day throughout my usage of Void Linux.

Another thing I could see from my personal history is that I am indeed a 'lazy updater',
sometimes letting a month or more slip between running updates on my machine.[^lazyupdates]
Curiously, I can also glean from the list above that I have indeed _never_ updated my system on a Sunday.

[^lazyupdates]: It is one of the reasons why I switched from Arch Linux to Void Linux, in fact. While both provide rolling updates, I did not need the constant bleeding edge for all packages on my system, and running an update after a little while on Arch Linux always presented one with (literally) hundreds of package updates, often already after only a couple weeks.

## Kernel longevity

Another question that I find quite interesting is this:
How long were the various kernel versions in use?
Or, more precisely, which ones are the versions that have the longest 'life-spans' in the repository, or the shortest ones?

But first, let's investigate the overall download numbers per kernel.

For this we'll use the `kernels.csv` file, so let's take a look.

| date | kernel | downloads |
| --- | --- | --- |
| 2025-11-20 | 6.17.7_1 | 6 |
| 2025-11-20 | 6.17.8-tkg-bore-alderlake_1 | 1 |
| 2025-11-20 | 6.17.8-tkg-bore-zen_1 | 1 |
| 2025-11-20 | 6.17.8_1 | 12 |
| 2025-11-20 | 6.6.111_1 | 1 |
| 2025-11-20 | 6.6.116_1 | 3 |
| 2025-11-20 | 6.6.65_1 | 1 |
| 2025-11-20 | 6.6.87.2-microsoft-standard-WSL2 | 1 |

This file is almost perfectly usable as-is, but I am only interested in the actual kernel versions,
so the first three version dots (e.g. `6.17.7`).
I don't care about the void-internal release version (the `_1`),
nor the weird custom-compiled kernels people are using (e.g. `tkg-bore-alderlake_1`).
But since I also don't want to straight drop them from the data,
we'll do a little regex string substitution:

```nu
mkdir outputs
open input/popcorn/output/kernels.csv |
  update kernel { str replace --regex '^(\d.\d+.\d+).*' "$1"} |
  group-by --to-table kernel |
  save outputs/kernels_standardized.json
```

Here we remove anything that is not part of the version string by essentially replacing the whole line with just the version itself.
This process takes a while for the over 57.000 lines contained in the file,
so I am saving an intermediate output version that I'll use for the next steps.

We'll start by summing up the absolute numbers of kernel uses per version,
of which we can keep the top 5:

```nu
open output/kernels_standardized.json | update items { $in.downloads | math sum } | sort-by items | last 10
```

This show us that:

| kernel | items |
| --- | --- |
| 6.1.31 | 1340 |
| 5.8.18 | 1674 |
| 6.12.41 | 1744 |
| 5.13.19 | 2500 |
| 6.3.13 | 2624 |

The kernel that was run the most in terms of _absolute numbers_ was kernel version 6.3.13,
with 5.13.19 coming up relatively closely behind.
The other kernels are trailing somewhat further behind with the next kernel having almost 1.000 fewer uses.

But I originally wanted to know about the _longest lived_ kernel in these data,
so how do we extract that?

We'll take the grouped `json` file and do a similar aggregation as up above,
except creating a new column for the first (`math min`) and last (`math max`) appearance of each kernel version.
Then we can take those two and,
since they are of type `datetime`,
simply subtract one from the other to get the total `duration` that the respective kernel appeared in the data.

```nu
open output/kernels_standardized.json |
  insert first { $in.items.date | math min } |
  insert last { $in.items.date | math max } |
  reject items |
  into datetime first last |
  insert delta {$in.last - $in.first } |
  sort-by delta |
  last 10
```

By sorting on the delta value and keeping the last ones we have essentially filtered for the 'longest'-lived kernel versions,
leaving us with the following:

| kernel | first | last | delta |
| --- | --- | --- | --- |
| 6.1.6 | Mon, 16 Jan 2023 00:00:00 +0100 (2 years ago) | Sat, 5 Apr 2025 00:00:00 +0200 (7 months ago) | 115wk 4day 23hr |
| 4.19.59 | Wed, 17 Jul 2019 00:00:00 +0200 (6 years ago) | Fri, 28 Jan 2022 00:00:00 +0100 (3 years ago) | 132wk 2day 1hr |
| 5.10.9 | Fri, 22 Jan 2021 00:00:00 +0100 (4 years ago) | Tue, 12 Sep 2023 00:00:00 +0200 (2 years ago) | 137wk 3day 23hr |
| 5.19.14 | Thu, 13 Oct 2022 00:00:00 +0200 (3 years ago) | Tue, 5 Aug 2025 00:00:00 +0200 (3 months ago) | 146wk 5day |
| 5.15.36 | Fri, 29 Apr 2022 00:00:00 +0200 (3 years ago) | Mon, 3 Mar 2025 00:00:00 +0100 (8 months ago) | 148wk 3day 1hr |
| 5.13.8 | Fri, 6 Aug 2021 00:00:00 +0200 (4 years ago) | Fri, 2 Aug 2024 00:00:00 +0200 (a year ago) | 156wk |
| 5.13.10 | Sat, 14 Aug 2021 00:00:00 +0200 (4 years ago) | Sun, 15 Sep 2024 00:00:00 +0200 (a year ago) | 161wk 1day |
| 5.12.13 | Sat, 26 Jun 2021 00:00:00 +0200 (4 years ago) | Mon, 23 Sep 2024 00:00:00 +0200 (a year ago) | 169wk 2day |
| 5.11.22 | Fri, 21 May 2021 00:00:00 +0200 (4 years ago) | Sun, 22 Sep 2024 00:00:00 +0200 (a year ago) | 174wk 2day |
| 5.2.13 | Sat, 7 Sep 2019 00:00:00 +0200 (6 years ago) | Sun, 7 Sep 2025 00:00:00 +0200 (2 months ago) | 313wk 1day |

We can see that especially kernel version 5 was long-lived,
with version 5.2.13 being in use for just over 6 _years_.
The exact nature of the time frame (September 7 to September 7) makes me think this may be some sort of automated installation.

Without skipping ahead too much, this makes sense to me looking at the wider picture,
as the `popcorn` statistics gathering was introduced in the middle of kernel 4's existence,
and we are not yet anywhere near the end of the kernel 6 life-span,
so version 5 probably had the most opportunity to have long-running installations.

## Top packages

Lastly, let's answer one more question:
Which packages have the highest _median_ daily installation counts across the whole period?

This will be a little more easy again --
we have all the necessary ingredients in the `packages.csv` file.
And with the tools we used so far,
it shouldn't be hard to create a pipeline which:
groups on the `package` column,
then aggregates the package `count` using the `median` method,
and finally sorts by the result of this aggregation.

```nu
open input/popcorn/output/packages.csv | group-by --to-table package | update items { $in.count | math median } | sort-by items
```

Of course, we'll have to be a little more careful with our pipeline here while building it and _definitely_ resort to filtering like `| first 1000` or similar while building it,
since constantly running over 17 million lines through the pipeline will be a little too much for the machine otherwise (at least, definitely for my machine with 8GB of RAM).

In fact, running this full command completely saturated my memory and made heavy use of my swap memory so it wouldn't have to crash due to running out.
Of course, with so much swapping this also massively slowed down the process, so the above command took a little over 13 minutes to complete on my system.

Here's the result of all that number crunching:

| package | items |
| --- | --- |
| smartmontools | 25.0 |
| psmisc | 25.0 |
| base-system | 26.0 |
| ntfs-3g | 26 |
| void-repo-multilib | 27 |
| xorg-minimal | 28.0 |
| lvm2 | 29 |
| unzip | 29 |
| base-devel | 30 |
| void-repo-nonfree | 31.0 |
| neofetch | 33.0 |
| lm_sensors | 35 |
| zip | 42 |
| xmirror | 42 |
| socklog-void | 48.0 |

So, what does that tell us?
I think there's a few interesting observations to be made here.

First, remember that we are looking at the _median_ number installations of packages over the _whole_ time period.
So, even if a package was slow to get going with a few days of only having a single user,
it shows up here.
Similarly, however, if a package had one or multiple periods of intense use but is more erratic in its overall usage pattern,
this will not be reflected here.

Second, we are looking at the _number of installations_,
so the daily report of who has this package installed on their system.
The most-installed package here is `socklog-void`, which makes sense as the main suggested package in the [documentation](https://docs.voidlinux.org/config/services/logging.html).
The high prevalence of `xmirror` is a little more surprising to me,
though it is, once again, the [suggested method](https://docs.voidlinux.org/xbps/repositories/mirrors/changing.html?highlight=xmirror#xmirror) of changing your installation's repository mirrors.

`zip` being ahead of both `base-system` and `base-devel` is somewhat amusing to me,
as is the latter also being ahead of the former.

But overall I think this distribution of packages makes sense, as they all describe long-lived utility programs which _any_ user of a distro may find useful (as opposed to more focused programs such as design software like `gimp` or text editors like `neovim`).
With one curious exception:
`neofetch` is on the 5th spot of packages,
which is a giant surprise to me.

Personally, I don't use a `fetch`-like program,
as I think it just adds clutter to the terminal.

But I am truly surprised at the amount of people having it installed.
I suppose it makes sense in the way of installing it once,
for a show-case or to check your system at a glance,
but then not uninstalling it since it is just so unobtrusive.
Nevertheless, this surprises me greatly.

## Conclusion

This was a fun first excursion into the package statistics of Void Linux.
As I said on the outset, I hope to have a more detailed article out at some point which looks at some of the changes over time a little more visually,
but this was a lot of fun.

And I think it also really shows the power --
and the limitations --
of `nushell`.
I could quickly switch between a multitude of data sources,
and my data cleaning and transformation tools remained the same.

The mental model behind operations is also much more akin to more data-oriented workflows and tools like `Python Pandas`, or `SQL` or even `R`,
which I think is a boon when first introducing the idea of using the shell to more data-oriented folks.

However, I also stumbled onto the edges of what is possible with the shell on my machine.
There may be approaches that make use of data streaming which I haven't discovered,
but running transformations on the giant data for packages nearly brought my machine to its knees,
and would still be much better accomplished with `Python Polars` for me currently.

In conclusion, use `nushell` for the right purposes:
the quick turn-around of exploring medium-sized datasets,
or taking a first look into parts of large datasets,
while always staying flexible and having the full power of an interactive shell at your fingertips.
Once you wrap your head around the more functional approach to how data streams through your pipelines (and I'm still in the process of doing so),
it just becomes plain _fun_ to explore all manner of datasets.
