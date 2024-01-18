---
title: "Editable injections with pipx"
description: "Working on your project and injecting changes in real-time"
pubDate: "2024-01-18T17:31:13+01:00"
weight: 10
tags:
  - python
---

It is possible to inject your development environment into any python environment, even if that runs system-wide!

Just a shorter tip for today that I recently found out while developing a python plugin for another python application.

A couple times in the past, while developing something which interacted with a python package installed on my local system, 
I wanted to see the changes reflect in there, directly interacting with my system installation,
instead of only my local development environment.
This is easy if you use `pipx` for your python package management.

## The dev-local way

Let's first look at the way to inject the *other* application *into* your development environment.

This is a valid strategy, it keeps everything you are working on isolated from the overall system and thus your system safe from inadvertent changes.

The simplest way, using the `poetry` virtual environment manager as an example,
is of course its `poetry add <external-package>` functionality.

This is how you officially add libraries to your program dependencies.
If you only want to add it to the development dependencies instead, do `poetry add --group dev <dev-library>`.[^depsdevdeps]

[^depsdevdeps]: The difference between regular dependencies being that *users* need to install those when using your program or library, and development dependencies being ones that are only required while *developing* the program.

So far, so traditional.
But what if you want to add a package or library that should *not* appear in the program dependencies as well?[^pyproject]

[^pyproject]: Meaning it appears nowhere in your `pyproject.toml` or `poetry.lock` files in this case so that nobody else needs to install it in their environment while using or developing the project.

Then, the most 'official' I found recommended at least for the `poetry` project to be the following:[^poetyinject] 

[^poetyinject]: From poetry issue [#951](https://github.com/python-poetry/poetry/issues/951).

```bash
poetry shell
pip install <my-secret-dependency>
```

In other words, you manually enter the environment and globally install whatever library or program you need.

This is all well and good - and probably works for most situations.
But what if you have quite a few external dependencies that should *not* appear for everybody?
What if you yourself still want to track dependencies?
What if you *want* to interact with the rest of your system?

## The system-wide way

I realize those what-ifs will exclude 99 per cent of use cases.
And for the hundredth case, probably `docker` might actually a more isolated, professional approach.
But still, here is one:

I am developing a python project which interfaces with another python application as a plugin to the other one.
It uses settings and files which are set up for my own system and I want to see whether my plugin can work with those and whether the interactions are what I envision.

At the same time, it seems like way too much effort and time-investment for me to set up 
a separate `Dockerfile` with all the ingredients and dependencies and then keep it updated with 
my settings, my files, and my evolving code base.

Here's what I use it for exactly:
I have a big library of references and corresponding PDF files,
thousands of entries sorted into several sub-libraries from my time as a student, my academic work, and my personal research.
I use the fabulous command line `papis` reference management software to keep it all in check.
Now, I am developing [a plugin](https://github.com/marty-oehme/papis-extract) for this program, 
with which I can automate the extraction of PDF annotations and highlights from all my PDFs into plain-text notes.

Naturally, I want to test my plugin on my own library at some point.
And the most simple way I found to do this is by *inverting* what we inject.

Instead of injecting the external program(s) into my development environment, 
by using `pipx` we can inject our code into the live external program libraries.[^alwayspipx]
And it is super simple:

[^alwayspipx]: This is double easy in my individual case since I am *already* managing my `papis` installation with `pipx`, which allows me to simplify things like keeping other plugins together and updated along with the overall reference software.

```bash
pipx install <external-program> # This is the system-wide papis installation I am already using
pipx inject --editable <external-program> .
```

We simply inject our current project directly into the system-wide environment `pipx` manages for us.
We also tell it to do so as `--editable` so any changes in our local code are *instantly* reflected on the outside program.

In my specific case this results in:

```bash
pipx install papis
pipx inject --editable papis .
```

I keep a whole other list of injections in the same environment, 
most from `pypi` but some from GitHub as well, 
all programs my own code can interact and be tested for conflicts with, 
and all neatly outlined when invoking `pipx list --include-injected`.

There you have it - quick injection of local code for development system-wide using `pipx`.
