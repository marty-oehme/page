---
title: "Riddle me this: GUI freezes due to pulseaudio"
description: "Detecting slowdowns and freezes in the most unlikely of places"
pubDate: "2021-04-13T10:00:00+0200"
weight: 10
tags: [ "linux" ]
---

Over the last half a year to a year,
there have been some troubles plaguing my otherwise lovely Linux experience.
More specifically,
there were a couple of slowdowns and freezes that would darken my otherwise bright days.

## Call to adventure

At first, opening Zathura took seconds instead of milliseconds.
I remember it first happened during me writing papers for my studies, a semester back.
I was still using both a laptop and a desktop computer ---
and the slow load times would only affect the laptop computer I was using less for writing anyways.

So, due to time constraints and other priorities,
I accepted the regression and mostly forgot about it for a while.

Since moving to another country, I am solely relying on my laptop for all my work.
And overall it is a lovely experience.
But the slow Zathura opening times stayed a constant,
and seemed to come back with a vengeance.

For whatever reason, opening Zathura would *always* take multiple seconds,
with weird graphical glitches displayed while it was unresponsive.
Well, I accepted it as a regression and tried to work around it ---
after all, it was only a few seconds here and there and I'm not constantly opening PDF files.

Unless when I am.
I am writing and citing a lot again, for a couple of months now.
And the slow Zathura startup has been a constant pain.

I perused forums, I found ancient tips of improving its startup time by clearing caches,
changing backends, optimizing thumbnail displays or the amount of preloaded PDF pages.
Nothing worked.

Recently, the few GUI applications I still use seemed to become a bit more sluggish.
It started with the Networkmanager tray applet which needed a couple of seconds before I could interact with it.
Soon, the Nextcloud GUI needed more time before I could correctly used it.

## Threshold

Then, it moved to my citation manager of choice, JabRef.
Opening and editing entries would take multiple seconds,
but I blamed it on my obscenely large BibTeX library file.

Today, I could not use the file dialog anymore.
The file picker would literally freeze when I tried to append PDF files to the JabRef entries,
and I just *had* to look back into it.

## Mentor

My journey began crawling through the Arch Wiki,
as it does so often.
Since it only affects GUI applications,
it was bound to be caused by some GTK or QT trickery.
And as usual there were a couple of promising leads written about,
that could ostensibly get me at least on the right track to fixing it.

GTK applications seem to have trouble working correctly when the dbus is proxied,
or one of the desktop environments' xdg portals would be running in the background.
Sometimes it happened due to [flatpak installations](https://forum.level1techs.com/t/gtk-applications-are-super-slow-at-startup/166540)
Perhaps the accessibility option of GTK programs was the cause.
Or DBUS, DISPLAY and XAUTHORITY environment variables were not made available to the programs.

## Abyss

In the end, I stumbled over an old, unanswered [archlinux forums](https://bbs.archlinux.org/viewtopic.php?pid=1761580#p1761580) post which seemed to complain about the same issue I had.
Nobody answered him, and it seemed I would just have to live with the slow startup.
The most promising candidate seemed to be a [falsely created `.xinitrc` file](https://bbs.archlinux.org/viewtopic.php?id=239331).

But none of it worked. None.
The weird part was:
when I would run the programs as the root user,
none of the problems appeared.

## Transformation

So I began removing anything from my home directories usual suspects of `.cache`, `.config`, `.local` which seemed to have to do with GTK.
Still no change.
Ultimately, I took a more drastic measure ---
I moved the entirety of my `.config` folder to a temporary spot (`.config-disabled`).
And what do you know,
Zathura started behaving like the lightning fast program that it was, again.

So, I thought, easy --- the culprit must be my `Zathurarc` configuration file.
I moved everything back in place except for Zathura's settings.
No dice.
It was back to a crawl, just like my other GUI applications.

Alright, on to dividing and conquering, then.
I created a `disabled/` folder within my `.config` files and started sorting:
First, half of the alphabet had to go `mv {a..m}* disabled/`.
Still slowed down. Everything to 's' followed `mv {n..s}* disabled/`.

And all of a sudden, the programs were fast again.
Some additional drilling revealed the culprit not to be in 'q' as I assumed
(with some `qt*` entries in there),
but in 'p'.

What could be in 'p' that would be so egregious?
Of course, some of my 'powermanagement' profiles were lurking in there.
But no, they were also not to blame.
Everything could slot back in place, except for one folder:
`pulse`.

What?

## Atonement

How could pulseaudio be the perpetrator of all this nonsense?
How could it *slow down the start of my PDF reader*?

Well, it turns out I had set up pulseaudio to stream sound to some speakers connected nearby.
In doing so, I mucked about with the server instructions of the program.
The only instruction left in my pulse `client.conf` configuration file was a single line declaring\
`default-server=10.0.0.10`, a server which, since moving house, did not exist anymore.

Removing this line, and thus the file altogether instantly fixed all my GTK troubles.
Zathura is starting up fast as a button again,
I can easily use the file picker dialog and JabRef again.

To be perfectly honest,
I still don't know how that line can lead to a cascading effect through the system that much.
Of course, ultimately I am to blame here ---
I played around with pulseaudio way back when and forgot to undo some of my shenanigans.
But on the other hand,
let's be real here:
How in the world could I have assumed that *pulseaudio*, of all things,
was bringing my citation management to its knees?

For now, I'm happy to return to opening my PDFs at the speed I was once used to.
