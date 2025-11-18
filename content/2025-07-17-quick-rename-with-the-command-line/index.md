---
title: Quick rename with the command line
description: Using vidir to recursively change file extensions
pubDate: 2025-07-17T19:28:42
tags:
  - commandline
  - ansible
weight: 10
---

This is going to be a quick post which I will use to
a) show how quick it is to find and rename stuff with the command line, and
b) thereby express my love for being able to work in such an environment.
If you don't care about the background, skip below to see how it is easily done.

I have recently rewritten more of my homelab infrastructure to be managed with Ansible.
Ansible uses `yaml` files for almost all of its code --
variables are set in `yaml`,
tasks are provided in `yaml`,
handlers are written in it,
and everything is combined into `yaml` playbooks.
There is a reason Ansible and Kubernetes DevOps people are somewhat derisively called 'YAML engineers'.

Now, I personally don't find `yaml` to be as horrible as [some](https://news.ycombinator.com/item?id=21101695) other [people](https://news.ycombinator.com/item?id=26234260).
It has its use cases and configuration management is definitely one of them.
But it also comes with a _lot_ of [edge cases](https://noyaml.com/) and some very [complex rules](https://ruudvanasseldonk.com/2023/01/11/the-yaml-document-from-hell).

A tiny one that aggravates me is the proliferation of multiple extension formats:
Do I use `.yml` or `.yaml`?
Well, already since [2006](https://github.com/readthedocs/readthedocs.org/issues/7460), there has been an officially recommended way: use `.yaml`.
And as we all know such post-hoc recommendations are always followed swiftly[^swift] and orderly.

[^swift]: If you can call around 20 years swiftly, I suppose.

Of course not; both extensions are _all over the place_ in many projects that make use of the format.
One example being Ansible.
When creating new roles from `ansible-galaxy`,
all the files receive a `.yml` extension.

However, my existing task and configuration files all come with the `.yaml` extension instead.
So this is what we are doing:
Unifying the extensions of _all_ `yaml` files in a single directory, recursively.
Altogether, there are around 500 `yaml`-type files in my infrastructure directories,
appearing in a wild mix of both extension flavours.[^counting]

[^counting]: A number which, by the way, is also very nicely findable with the help of the following command line one-liner: `fd --extension=yaml --extension=yml . <my-dir> | wc -l`

## Fixing the extension problem

To unify `.yaml` and `.yml` file extensions into a single `.yaml` type is surprisingly easy with the help of two tools:

- `find` (or, in my case the more modern `fd`)
- `vidir` which uses trusty `vim` to mass-edit files

It consists of two steps --
first, we find all `.yml` files (using `fd`);
and, second, we rename them all (using substitution in `vim`).

To list all the files _recursively_ which have the wrong extension is the following simple command:

```sh
fd --extension=yml <dir> | vidir -
```

Take note of the `-` dash after `vidir` which loads files from `stdin`.

This loads _all_ the wrongly named files into a vim buffer at once.

> You could do all sorts of edits on these files in the vim buffer now,
> _including deleting **all** of them at once_ if you are not careful.
> So always think before you do.

Indeed, what we will make use of is the `:substitute` command that vim offers us.
It allows replacing arbitrary regexes on the current line, a line selection, or,
as we will do,
on the whole buffer.

Invoke the command `:%s/\.yml$/.yaml/` and it will change every line to reflect the change from the old extension to the new.
After inspecting visually, saving the buffer and exiting, `vidir` will actually process the changes.
And all at once hundreds -- possibly thousands -- of files are renamed without breaking a sweat.

That's it.\
And it is exactly why the command line can be such a joy to work on.
Yes, it has a steeper learning curve at the beginning than using GUI software.
And yes, some of its archaic syntax and replacement rules can be a real head-scratcher from time to time.[^nushell]

But for the kind of structured or semi-structured task with ad-hoc requirements such as this,
working on the command line, for me, just cannot be beaten.

The overall process took me around 20 seconds.

[^nushell]: A problem which modern shells such as [nushell](https://www.nushell.sh/) will hopefully make less dire over time.
