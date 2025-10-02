---
title: "Inserting JavaScript into Hugo Posts through your front-matter"
description: "Simple, idiomatic Hugo embeds without any additional JavaScript."
pubDate: "2019-02-02T10:09:45+01:00"
weight: 10
tags:
  - hugo
  - blog
---

## What we want to achieve

Often I want to insert examples, interactivity, and quality-of-life features
into one of these blog posts. I will invariably have to reach for JavaScript to
achieve it. But it annoys me to have to manually include the scripts through
the source file. Also, it just feels wrong to do this by hand when using
a static site generator like Hugo. Let the generator take care of it.

We can embed it through a Hugo short-code. In the right circumstances, this is
the correct method. But short-codes appear in the text. They want to describe a
part of the article which exists at this location. JavaScript embeds don't
always do that. They can, when the embed refers to a specific example which I
want to insert at the short-code location. But they don't have to for a lot
JavaScript functionality. Then again, the way we declare data for a post is to
put it in the post's [front-matter](TODO link). For me, the right way to embed
JavaScript in one of my posts is to create a 'universal' embed-code.

In the following two paragraphs we will see how to create a Hugo short-code,
embedding JavaScript within the text. We will then look at how we can set Hugo
up to embed any JavaScript added in the front-matter.

<!-- vale 18F.Titles = NO -->

## JavaScript via short-code

<!-- vale 18F.Titles = YES -->

Creating new short-codes in Hugo is straight-forward. Most themes, and Hugo
itself, contain
[an array of them](https://gohugo.io/content-management/shortcodes/#use-hugo-s-built-in-shortcodes)
already. Creating the code snippet to embed JavaScript is rather easy. Create a
new an html file in the **layouts > shortcodes** directory in your Hugo folder.
Call it whatever you want to call your short-code. We will use `js` for this
example to keep it straightforward. All you have to put into this html file is
the following:

```html
<script src="{{ .Get 0 }}"></script>
```

This will let you call embed JavaScript at a specific location in your text by
calling `{{ % js https://link.to/my-javascript-file.js % }}`. You can do [way more](https://gohugo.io/templates/shortcode-templates/)
with custom short-code templates, but even this example gives some advantages.
Say we were to decide on a new style of embedding JavaScript. We change the
template and _all_ our earlier embeds automatically update. We may add a new
Generally in-text embeds like this are more specific. They embed a YouTube
video, or a GitHub gist -- but this is their basic idea.

<!-- vale 18F.Titles = NO -->

## JavaScript via front-matter

<!-- vale 18F.Titles = YES -->

What if we do not want to embed our file at a specific location. What if the
JavaScript we wrote is not specific to a location _on_ the page but related to
the page _itself_. What if we need it on a lot of separate pages, but not every
one. In that case, I prefer to use the front-matter. It separates the content of
our article from the content of our page and let's us change both individually.

Accomplishing this is not that different from creating a short-code. The biggest
change is where we place the template. Instead of creating a short-code html
file, we will put the code into the footer template partial.[^1] Find the footer
partial in your **themes** > **theme name** > **layouts** > **partials**
directory. Copy it into your main page directory while keeping the folder
structure the same: **layouts** > **partials**. Then add the following to the
bottom of the partial:

```html
{{- range .Params.js }}
<script src="{{ . }}.js"></script>
{{- end }}
```

This uncomplicated template will allow you to add the following to the
front-matter of your pages:

```yaml
---
title: "Inserting JavaScript into Hugo Posts through your front-matter"
pubDate: "2019-02-02T10:09:45+01:00"
js:
  - "my-relative-file"
  - "https://link.to/my-absolute-file"
---
```

Hugo will include both of these files will in your page when it compiles. It
will do so for any number of files you append. The absolute link is
straightforward, the relative link lies at the root of your static folder. You
can use `js: "folder-to/my-relative-file"` if your file is in a sub-directory.

At its simplest, that is all we have to do. In the name of keeping things
modular, it may be worth it to put the html snippet into its own `scripts.html`
partial and append that to the footer instead, more so when your theme has its
own complicated footer already. I will keep that an exercise for you to
experiment with. Now try your hand at your own front-matter embedded page customizations!

Thanks for reading.

[^1]: This will not work if the theme you are using does not place a footer somewhere on each page. Most themes do this for the pages. If yours does not, you can override it to do so. Place the footer-partial html code on the single.html layout default. Or you can use some other partial which appears on every page in your layout.
