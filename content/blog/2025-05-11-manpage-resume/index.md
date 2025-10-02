---
title: man 1 marty
description: Installing yourself as a manpage
pubDate: "2025-05-11T10:48:35"
tags:
  - linux
weight: 10
---

Read my manpage directly online in [html](../resume/man.html) form,
or [download](../resume/marty.1) me as a fully functional manpage!
You can then inspect me with `man -l marty.1`.

You can even install me as a [debian package](../resume/marty.deb)!
Just start `dpkg -i marty.deb` on debian (or any debian-derived distribution) and you can read me with `man marty`.

**Contents**:

<!--toc:start-->
- [You can read me](#you-can-read-me)
- [Generate the roff file](#generate-the-roff-file)
- [You can install me](#you-can-install-me)
- [Generating the package](#generating-the-package)
<!--toc:end-->

## You can read me

Thanks to the underlying pandoc platform, Quarto allows easy output to the 'groff' man format.
Since my resume is data-driven, I have done my best to decouple content and presentation.[^decouple]

[^decouple]: Presentation is usually taken care of by typst in my current resume iteration, which I find much easier to work with for PDF output than LaTeX. The content itself is kept in a yaml file, which works well enough -- even if the yaml format is really a little convoluted.

One of the nice things that come out of this is that we can display the contents of our resume however we wish --
think HTML and CSS decoupling.
While I would like to ultimately present an HTML-driven version directly on the About page of my website,
I did not yet find the time for polishing and presenting it in an adequate form.

I did, however, find myself with a couple free hours on a weekend day and came across [this](https://mehalter.com/#about_me) web presentation, which includes themselves as a manpage.
I love the idea and thought this would be a perfect platform to test out the flexibility of a data-driven approach.
Two-three hours later, I exist as a manpage and can be installed on any debian-managed system.

## Generate the roff file

Quite honestly, even though I knew it would be possible, it was surprisingly easy to change Quarto to output into a man-compatible format.

While I have recently moved away from using Quarto for my actual PDF-styled CV,
it was easy to build up a quick markdown-driven `.qmd` file which gets transformed into a manpage.

Here are the basic building blocks:

```markdown
---
title: "marty"
section: 1
wrap: auto
columns: 60
header: User commands and usage
format:
  man:
    code-fold: true
    echo: false
---

## NAME

marty - describes the format and characteristics of one or more instances of Marty Oehme.

## SYNOPSIS

| **marty** \[**-e**|**\--education**] \[**-f**|**\--freelance** _client_] \[**-e**|**\--employee** _employer_]
| **marty** \[**-h**|**\--help**|**-v**|**\--version**]

## DESCRIPTION

**marty** is a code fiddler, research helper, and open data proponent.
```

You add the usual quarto yaml header on top,
describing the title of the page and the format you want it to appear in, `man`.

The `man` format takes a couple of extra options compared to other formats,
such as the manual `section` it would appear in, and the `column`ar `wrap` you want to give it,
as well as a `header` or `footer` if you want to provide those.
All of these are optional, however.

Since this was just a quick evening project, I knew that I would not create _everything_
in the document dynamically.
Theoretically we could have our command 'options' synopsis also be created programmatically,
but this was going too far for the little project and I just create it manually.

Then comes the actual description and options which uses each option as a section of my resume.
Here is where we really make use of the data we have at our hands.
First we load the yaml contents into a python data structure:

````python
```{python}
#| echo: false
import yaml
with open("./content.yml") as f:
    content = yaml.safe_load(f.read())

def at(obj, lang="en"):
    return obj[lang]
```
````

I do this at the top of the document,
which is generally where I will have one codeblock doing all the basic administrative work
for the rest of the document
(loading libraries, loading data files).
If using `yaml` as the data format we will have to install the `pyyaml` library on our system or in the surrounding virtual environment,
since python does not package support for it in the standard library.

Then, we can make use of our data further below:

````python
### Options

-e, \--education

: Prints brief education information.\

```{python}
#| echo: false
from IPython.display import display, Markdown
outp = ""
for ed in content["education"]:
    place = ed["place"]["en"]
    title = ed["title"]["en"]
    date = ed["date"]["en"]
    outp += f"> **{title}**\n _{place}_ ({date})\n\n"
Markdown(outp)
```
````

This runs through my `education` data as a nested dictionary,
grabbing the pertinent information from each entry and adds it to the `--education` option of the manpage.

I do not know the `troff`/`groff`/`*roff` formats terribly well so my use of `\n` newlines and `\` linebreaks is probably not very well done or even unnecessary,
but it creates a rather pleasing end result so after some experimentation that is what I have settled on.

The same technique is used for my `experience` as a freelancer and as a salaried employee,
as well as listing skills below as `EXAMPLES`.

You can have python create whichever markup you please.
For the environment variables for example I chose to display the places I've lived in and volunteered at in the `THING=PLACE` style with the dates in the explanatory description below,
which I think is a fun presentation style.

```ansi
ENVIRONMENT
       DEFAULT_LOCATION=Berlin
              Changes the default location of marty.

       OLD_LOCATION=Leipzig
              Shows the previous location of marty.
              Automatically changes when DEFAULT_LOCATION is changed.

       ZEITRAUM=Heizhaus_association
              Transferring Digital Competence in Aging.
              Environment only valid 2023–2024,
              setting completely optional (volunteering).

       VERPIXELT=Urban_Souls_association
              Technical assistance for conveying digital
              competencies. Environment only valid 2023,
              setting completely optional (volunteering).
```

Similarly, my language competencies are embedded in the prose text description of my `BUGS` with the following code:

````python
## BUGS

```{python}
#| echo: false
from IPython.display import display, Markdown
langs = []
for l in content["languages"]:
    name = l["name"]["en"]
    lvl = l["items"][0]["en"]
    langs.append(f"{name} ({lvl})")
Markdown(f"Currently there is one known issue for **marty**, he can not be run as C language code. He can only be run in the following languages: {", ".join(langs)}.")
```

If you have found any additional bugs or issues,
don't hesitate to contact the author.
````

Which produces the following output:

```ansi
BUGS
       Currently there is one known issue for marty,
       he can not be run as C language code. He can
       only be run in the following languages: German
       (native), English (fluent), French (basics).

       If you have found any additional bugs or issues,
       don’t hesitate to contact the author.
```

## You can install me

As the cherry on top I thought would it not be nice to be able to have an actual package manager install my resume on people's machines?

Not that I expect anybody to really do it,
but since we are having fun exploring the possibilities here,
let's just go for it.
I chose the `.deb` package format that `apt`/`dpkg` of debian speak simply because it is so widespread that everybody should understand what we are going for here.

Theoretically you could take the package and upload it to a repository so people can actually install the manpage via `apt install` (and even keep it updated),
but that is going a step too far --
while it is highly unlikely anybody would install the package above in the first place,
there is no way that someone wants an updated copy of it cluttering their package manager.
The extra hassle, while a good learning opportunity,
would just be a waste.

## Generating the package

I use a `Makefile` in the root of my repository to create my CV usually,
so I simply extended it to also create the `.deb` package when I need it to.
I consulted some stack-exchange [comments](https://unix.stackexchange.com/questions/516472/using-heredoc-in-a-makefile-is-it-possible) which explained how to embed here documents and whole scripts in a `Makefile` variable.
And, building off of my usual use of `make` to create resume creation targets,
these are the full additions to generate a manpage and package it in a `.deb` package:

```make
man:
    mkdir -p build
    /opt/quarto/bin/quarto render cv-man.qmd --output-dir build
    pandoc -t html -f man build/cv-man.man > build/cv-man.html

define _script
cat > build/DEB/DEBIAN/control <<'EOF'
Package: marty
Version: 1.0
Section: custom
Priority: optional
Architecture: amd64
Essential: no
Installed-Size: 1024
Maintainer: Marty Oehme <contact@martyoeh.me>
Description: Contains professional usage instructions for marty
EOF
endef
export script = $(value _script)

mandeb: man
    mkdir -p build/DEB/DEBIAN
    mkdir -p build/DEB/usr/share/man/man1
    cp build/cv-man.man build/DEB/usr/share/man/man1/marty.1
    @ eval "$$script"
    dpkg-deb --build build/DEB build/marty.deb
```

We create the required directory structure in a `DEB` directory,
and `cat` the required contents of the debian `control` file into it.
Then we simply copy the manpage into the right directory and use `dpkg-deb` to create the package.

## Going further

I am happy with what just a couple hours of tinkering achieved.
This is nothing grand but I think it's good for a laugh --
and I can always just tell people to install me now!

If you want to take this further, here's a couple ideas:

Since we are already using a `Makefile` to describe our recipe,
you can just transfer it into GitHub workflow language,
(or whichever CI provider you prefer)
to have an actually always up-to-date deployed manpage version of yourself.

Like I mentioned above, you could set up a repository,
or something like a `PPA` to serve this updated version to people for whatever reason.

Also, this manpage is currently only in English.
However, `man` has a concept of multilingual pages,
and my personal resume data exists in German and English both.
So it would be feasible (and not too difficult actually) to deliver
my manpage in multiple languages.

It would require removing the hardcoded `["en"]` python dictionary accessors above,
and could for example use Quarto's concept of a document `lang` to decide which
of the versions it accesses.
Then, the packaging process would simply have to copy both files into their respective directories[^dirs]
and you are off to the races.

[^dirs]: (`/usr/share/man/man1/` and `/usr/share/man/de/man1/` if I am not mistaken)

However, for my part this was enough tinkering on a fun experiment.
Anything beyond this, for me would move into the wasting-time slot of the weekend project category,
which I can unfortunately not afford too much currently.

Nevertheless, I hope this was both a fun read and perhaps even a little instructive as to the flexible nature of data-driven writing.
Try it out yourself, and make yourself into a manpage!
