---
title: "A stable Zettelkasten"
description: "My notetaking setup with neovim and zk"
author:
  - Marty Oehme
date: today
pubDate: "2024-02-07T22:00:31+01:00"
weight: 10
tags:
  - commandline
  - notes
---

I have been an avid user of a somewhat Zettelkasten-inspired primary notes directory which I use as my personal knowledge base.
The system probably does not implement all the advantages and use-cases of a true zettelkasten, 
but I use some aspects that have worked very well for me: 

- Short notes that generally try to discuss a single knowledge fragment.
- Links between notes that create a larger coherent tree of knowledge.
- Stable linking by using never-changing anchors between the notes.
- Everything in plaintext (markdown) to have it future-proof, without lock-in and easy to integrate anywhere.

Primarily I edit basically anything with my trusty neovim setup, notes included.
However, having notes in this format presents a couple of non-standard issues when 
For the longest time, around 2 to 3 years now, I was using my own working-but-barely plugin to traverse and extend this notes directory.

I have not changed basically anything about this setup in a long time.
However, I have finally arrived at a point where I can fully rely on the fantastic [`zk`](https://github.com/zk-org/zk) command line utility,
together with its `zk-nvim` extension to fulfill all my needs for note-taking.

There's no specific reason for me to switch from my own `zettelkasten.nvim` plugin to this,
but it takes potential maintenance burdens off me, is much more mature than my dinky plugin (love you nonetheless!) and integrates amazingly with neovim's language server functionalities.

At a glance, what I need such a system to do is make it feel like I am browsing a highly-editable wiki.
So, the feeling of following links, searching the corpus and having information tagged is important.
`zk` allows all of this. 
I would encourage you to check out the [guide](https://github.com/zk-org/zk/blob/main/docs/getting-started.md) to learn how it makes it easy to keep a notes directory.

That being said, here are my personal requirements for interacting with a notes directory:

1. quick entry: I can create a new entry, move there and continue writing with minimum keystrokes
2. efficient search: I can open a search over my notes from anywhere and directly go to the results
3. flexible tags: I can make use of my existing colon-styled :tags:
4. permissive links: I can link to only the anchor of a note anywhere in my notes dir
5. stable links: Anchors are the only thing that matters for accessing notes
6. custom anchors: I can set what I want to be used as a note anchor

Let's go through them and see if and how `zk` fulfills my wishes one by one.

## Quick entry

Directly from the writing flow with minimum key strokes, I need to be able to create a new note and drop me into it so I can continue my thought.
The note creation process should thus be performed without being an interruption.
It would be great if the note could be pre-filled with my typical note structure from some kind of template.

For the last couple years, I used my own plugin to accomplish this: 
a single `return` press anywhere in my document was mapped to insert a link to a (not-yet existing) note.
Another press of the same button would open the note ready to edit.
If I had anything selected, it would even give the new note the selected string as link title and file name so I didn't have to type anything more.

It did not populate my new note from a template so I have been doing that on my own for the last several years.
It's not too cumbersome for me (3 headlines: title, 'Related' and 'References' per note) but I also noticed that I did it for Every. Single. Note.
So it is clearly a candidate for automation to eliminate unnecessary repetition.

Turning to `zk`, the vim integration `zk-nvim` provides me with the commands `ZkNew` and `ZkNewFromTitleSelection` which do exactly the same thing as described.

```lua
keys = {
	{ "<localleader>nn", "<cmd>ZkNew { title = vim.fn.input('Title: ') }<cr>", desc = "new note" },
	{ "<localleader>nn", "<cmd>ZkNewFromTitleSelection<cr>", desc = "new note from selection", mode = "v" },
	{ "<localleader>nN", "<cmd>ZkNewFromContentSelection<cr>", desc = "content from selection", mode = "v" },
},
```

This setup (in my lazy plugin loading code) is enough to mimic the old note creation behavior.
And the following sets up following links by pressing return, which I load only for markdown files:[^md-only]

```lua
if require("zk.util").notebook_root(vim.fn.expand("%:p")) ~= nil then
	map("n", "<CR>", "<cmd>lua vim.lsp.buf.definition()<cr>", { silent = true })
end
```

[^md-only]: One way to ensure something is only executed for a specific file type is by putting the code in a correspondingly named file in `~/.config/nvim/after/ftplugin/markdown.lua`. The `after` part of the location is not strictly necessary but ensures that your settings are not overridden by any other loaded file type plugins.

In fact, it goes a step further:
Using a template set in the `config.toml` file of the hidden `.zk` folder in my notes directory, 
it automatically adds all my necessary boilerplate and lets me get on with it.
It also drops me into the new file as soon as the link is created, removing another key press.

Brilliant!

## Efficient search:

One of the areas where `zk` shines, in my opinion.
`zk-nvim` provides vim commands for searching all notes `ZkNotes`, their tags `ZkTags`, the links `ZkLinks` and back-links `ZkBackLinks` of the current note.
It also integrates smoothly with [`Telescope`](https://github.com/nvim-telescope/telescope.nvim) for a nice search interface.

This is way better than what I was using before, which consisted mostly of `fzf` calls from vim and some `ripgrep` calls from my command line.
Now I can even create my custom search commands to perform within vim.

What I may even like best is that every one of these searches lets me simultaneously search *for* and *through* my notes:
There is an initial query which is run against the directory and limits the results somewhat (e.g. only tags or) and then I can use Telescope to search within those results.
Perhaps a simple example will clarify.

When putting the following in the plugin setup function:

```lua
require("zk.commands").add("ZkOrphans", function(opts)
    opts = vim.tbl_extend("force", {orphan=true}, opts or {})
    require("zk").edit(opts, {title = "Zk Orphans"})
end)
```

A command `ZkOrphans` is added which lists all notes that are not linked to from anywhere else.
Of course, it opens in Telescope like anything else so I can then in turn search through those results to find what I need.

Neat!

## Flexible tags

Contrary to the poor overloaded hashtag in larger media, tags for personal organization systems seem to come in all shapes and sizes.
Sure there is the `#hash` tag that will pop up in some systems, but so will `+plus` tags, `#double hash#` tags and, my personal favorite, `:colon tags:`.

As far as I know `zk` can work with any of them.

Quick win!

## Permissive links

Here, it gets a little murkier.
My own plugin allowed using both wiki-style links (`[[some-note]]`) and markdown-style links (`[title](some-note)`) and supported both in the same breath.
That means, there could be both wiki-style links in some note and markdown links and it would deal with both of them just fine.

`zk` also deals with both of them just fine, but does so on a configuration basis.
You set the style in `config.toml` and the whole notebook will only see and use those links.

This is slightly less flexible than I would like to be (I still have some very old notes that used a wiki-like syntax) but I should also be honest:
I haven't *really* noticed for quite a while now.
I rarely come across mixed-links anymore and if I do,
it's either a quick search query (if I am in a hurry or follow a train of thought) or a quick edit later that the issue is fixed.
While I would like `zk` to be a little more flexible here it also seems reasonable to follow a single link-style throughout your whole knowledge base and is what most programmes assume.
I am happy that it supports both at least.

Mixed message!

## Stable links

This, together with the next point, is where most other zettelkasten-supporting applications fail me.
Let's start with the stability of a link by looking at the instabilities of a note.

A note is: plaintext content containing my ideas, a file somewhere on my harddrive, a node in my knowledge tree designated by links.
Importantly, dimension number one and two of a note can change.

The content can be updated, maybe I change my mind on what I have written,
maybe I need to clarify or structure better later down the road.
The file can be relocated, either with the rest of my notes by moving the whole notes directory,
or relative to the other notes by being nested deeper in my notes directory.[^nesting]
Either of those happen under my active engagement with the material only.

[^nesting]: I generally don't nest but, you know, can happen. Some people primarily use folders to organize their notes. I'm not a big fan of the 1-to-1 restriction between folders and notes, and the feelings of 'box-in-a-box' joke presents elicited by deeply nested directories present.

The last point, though is my particular pickle with most systems.
When either of the first two change, the position in the knowledge tree generally does not.
The links pointing to it might, however, very well change even without your explicit knowledge.
Say you move your file - where do the links point to now?

I need links which never change - regardless of the individual note data and how it changes.
`zk` and my previous implementation both take care of it in the same (zettelkasten-approved) way, 
by using note IDs. 
Additionally, I can use *only* the ID in my links, so that we are also not bound to the name of the note itself even if it changes radically. 
`zk` also seems forgiving when coming across notes with *slightly* different titles.
When using the neovim LSP integration of `zk-nvim`, it will give you a little warning saying 'hey, this link seems a little ambiguous' but still take you where you need to go.

Personally, I am more fond of thinking of them as anchors, which keep notes in their place regardless of how stormy the sea of changes becomes around them.
You can, of course, manually 're-anchor' your notes by deliberately re-linking from other notes or removing irrelevant links from previous ones.
But never should they change or lose their position in your knowledge tree without your explicit doing so.[^wikiproblems]

[^wikiproblems]: This might be the biggest problem I have with many wiki implementations. Links to pages based on titles just seems to lead to so many problems down the road, be they the changing nature of titles mentioned above, or plain mis-spellings or special characters used in titles. I believe it is one of the reasons I come across so much 'link-rot' in a lot of small community wikis in which many people have the time to change something somewhere once but not enough to pay attention to the maintenance of the overall structural coherence.

Stable!

## Custom anchors

Finally, if the last requirement does not disqualify other note-taking implementations, this one usually does.
See, the note IDs - or anchors - mentioned above are not just random guids in my note dir.
Instead, they are a simplified timestamp with minute precision consisting of 10 digits,
pointing to the date of creation of the respective note.
So, if I create a note right now it would be `2402072157` for 21:57 of the 7th of February 2024.
It is followed by an underscore and a cleaned (slugified) version of the note title.

This is also where I thought `zk` would leave me.
It has a random ID generator running when creating a note and you can select the character set it will pick from: letters only, numbers only, both, hexadecimal characters or a custom selection like `[132fcknzs]` if you desire so for whatever reason.
But all of them are randomly generated, there is no way around that for the ID.

Or so I thought!
Technically, yes, IDs will always be randomly generated, this is currently the only strategy in the source code.
But while I was looking at the code to see if I could create a small feature to create the anchors I needed, another idea crossed my mind.

`zk` does not force you to include IDs when generating new notes.
That means, 
By setting the option `filename` in the configuration to `"{{title}}"` we could only use the title itself for example (like many wikis do), or to `"{{slug title}}"` to get a slugified version.

Now, `zk` uses handlebars for its templating engine, and it does provide a [date](https://github.com/zk-org/zk/blob/1471c6be2cc9f40090a688adec71424d6b639103/docs/template.md) function for templates as well.
By using a custom date format and not using a randomly generated ID at all, we can perfectly mimic the anchor creation style I have been using for my notes:

```toml
filename = "{{format-date now '%y%m%d%H%M'}}_{{slug title}}"
```

In fact, this discovery was the original reason for me switching fully to `zk` and removing my own plugin from 

Anchored!

## Conclusion

I am really, really happy with `zk`.
My full switch might come at a slightly 'inopportune' time,
with the maintainer of `zk` [stepping down](https://github.com/zk-org/zk/discussions/371) but I am not honestly worried.

First, there seems to be an active community that developed around the project,
with some eager new maintainers.
Of course, such avid adoption can sometimes die off relatively quickly after initial enthusiasm in times of forks and maintainer changes.

But even then, the application does absolutely everything that I need it to already.
Truth be told, the internet could explode tomorrow (yes, the *entire* infrastructure!) and I would still be exceedingly happy with my little neovim and `zk` solution.
It is simply the best note-taking experience I have had so far and - at least for now - there is little I want to change.

You can find my full set up to integrate with neovim [here](https://git.martyoeh.me/Marty/dotfiles/src/commit/fbceea242d9ffb058c664d2ab640e4b34167c1bc/nvim/.config/nvim/lua/plugins/prose.lua).
