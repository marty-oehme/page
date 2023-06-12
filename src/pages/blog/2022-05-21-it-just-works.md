---
layout: ../../layouts/BlogPostLayout.astro
title: "It just works"
description: "The confusing state of operating system robustness"
pubDate: "2022-05-21T12:01:51+0200"
weight: 10
image:
  url: "https://docs.astro.build/assets/full-logo-light.png"
  alt: "The full astro logo"
tags: ["linux", "opensource"]
---

## The magic words

The title of this post are the magic words so many people have settled on their operating system with.
Aside from those who just use whatever comes with their hardware purchase
[^defaultos],
there are really only two reasons to personally stick with a system:

- It has all the necessary, adequate, or best software for your intended purposes.
- "It just works."

If a system has been mandated to you (e.g. by your workplace) but it does fall into either of the categories,
I would argue you are not really 'sticking' with it but rather forced to bear it out.

For the first reason, software availability, the operating system itself can not really influence its ultimate fate in this regard.
If we think classically of the opposition between Microsoft Windows, Apple MacOS, and Linux,
generally the choice will fall onto Windows for enterprise office work and MacOS for a variety of enterprise design work.

While there _are_ viable alternatives for both of these tasks in the FOSS space (for [office](https://opensource.com/article/19/9/business-creators-open-source-tools), [publishing](https://opensource.com/article/21/12/desktop-publishing-scribus) and [design](https://opensource.com/article/22/2/open-source-creative-apps) work),
they are simply less valuable to a person interested in pursuing either professionally,
as long as employers value other such as Microsoft-owned or Adobe products options higher.
And, while I would welcome more openness to open source in professional work (and the very least government-oriented work),
there is really no blame to be apportioned here:
you learn the things you need to use and adapt to wherever the requirements come from.
[^softwareneed]

## Stability

I am more interested in the second reason.
While subsumed under a singular reason, the three magic words can mean a lot of different things to a variety of people.
What for me means my system can run and stay on for days on end means for somebody else that there are rare updates and changes to the software,
and for someone else still that it seamlessly integrates between a variety of different interfaces they use it through.
No one answer here is more correct or more important in a general sense, in fact how could it be.

So I wondered, first what is of prime importance to me, and then, where Linux stumbles still in my mind in a more general sense.
When I switched to Linux in the mid 2010s I had one burning impression seared into my mind:
unstoppable, unpredictable, unending Windows updates shoved down my and my computer resources' collective throats.
Sudden restarts when these updates finished or a focus-stealing pop-up window asking _when_ to restart if the system was being merciful enough that day.
The other side of the coin was slow-downs ---
both after leaving the computer running for a long while and over time,
as more cruft accumulated on the system ---
and the system itself having so much structural complexity that it was often easier to re-install Windows whole than to try to find the culprits.

## Choice

I am not against automatic updates, though I despise their nature of being forced upon me.
And while I prefer a simple to a complex system, I don't mind its existence as long as it gives me adequate levers to tame such complexity.
After my switch to Linux, I instantly recognized my variation of "it just works":
long-form stability with the _option_ of going under the hood to declutter, tinker and fix whatever was bothering me that day.
This option of course also introduced the potential for new instabilities
as my will to tinker exceeded my understanding of the system,
but these new issues were a problem centered on me and easily fixable within the boundaries of the system's possibility space:
Linux, the system, was not at fault for becoming unstable, it was my tinkering.
Tinker less and have a more stable system, tinker more or with less knowledge and you may introduce instability.

It's a trade-off that is user-centric and, in a sense, _opt-in_.
There was no way for me to opt out of my issues within Windows.
However, the invisibility of this opt-in nature is one fundamental block to the "just works" paradigm in my mind:
the possibility to tinker is not always decidedly and very obviously marked off as such
(as in, a specific advanced more, or expert settings)[^expertsettings]
and thus in the user's mind part of the issue of the operating itself instead of a step on the stability - tinkering seesaw.
In a sense, the system just exposes its fractures more visibly to the end user.[^settingsexposed]

## Interfaces

Secondly, the eco-system is often a big draw to a specific system,
with the integration of a variety of software and hardware (devices, interfaces, etc) into accessing or transforming ones personal data.
Anyone who used Linux around 10 years back will remember the absolute _hassle_ peripherals were -
whether that was audio equipment, input peripherals such as joysticks and controllers, graphics cards, or the dreaded printer.

While some issues remain (insert Torvald's finger to Nvidia here), the overwhelming majority of day-to-day peripheral needs is now a buttery smooth experience on the major distributions.
Not least, I would argue, since there is a [_massive_](https://unix.stackexchange.com/questions/223746/why-is-the-linux-kernel-15-million-lines-of-code) effort for driver availability, compliance, and functionality within the Linux kernel development.
But this, in the end, only reinforces my opinion on the problem starting a lot of "it _doesn't_ just work" thinking:
The issue is not necessarily fractures between all components in the eco-system space but rather more specifically the dividing line of open source and closed source devices and software.

Wherever FOSS interacts with Apple devices, if no programming interface is graciously exposed, people need to reverse engineer and cobble together solutions in the hopes of the upstream code they interact with not changing too soon or too often.
This of course becomes especially egregious when the closed source developer does not want such interaction to take place and intentionally severs its interface connections again and again ---
with the advantage of the 'longer lever' since they can see code adaptions on the open source side while not having to give up the advantage of hidden code.

## FOSS

I realize I am starting to re-explain the idea of FOSS itself but I have come to the realization that _these_ barriers are the real reason for me to go nuts having to fix something every now and again.
Just [recently](https://developer.spotify.com/community/news/2022/04/12/libspotify-sunset/) Spotify got rid of a long-time API allowing access to its streaming service through other interfaces.
One of those was [mopidy-spotify](https://github.com/mopidy/mopidy-spotify) through which I consumed most of my music at home
(combining both local file playback and spotify streaming).
With the deprecation of their interface and the inability to 'stay-back' on an older version of Spotify due to its closed nature,
I experienced another moment of "not working".
And while it's easy for me to put the blame on the Mopidy and Spotify extension developers[^developerblame],
the real fault lies, once again, in the closed nature of its upstream component.

It is these fault lines between FOSS projects and the larger, professional, capital-intensive 'outside'-world where most of my moments of fracture stem from.
It is also for this reason, among others, that I am continually pushed into a stronger stance on the necessity of open source, of free software and ---
looking at the right to repair, technology's environmental footprint and obsolescence cycles ---
increasingly the necessity of free hardware.

[^defaultos]: Which, to be fair, is still probably the overwhelming majority. It would be interesting to see how this works the _other_ way around, however. If you buy a specific hardware (i.e. MacBook) _in order_ to make use of the Mac eco- and operating system, aren't you making a conscious choice just as well?
[^softwareneed]: To make a comparison here, I would love to experiment more with things like NetBSD or FreeBSD since I am fascinated with their KISS principles but also realize that a lot of the niche software I make use of would not work as fluently here as I would need it to.
[^expertsettings]: In a weird sense, Windows 10 kind of followed this mantra with its leftover remaining control panel carcass hidden under some of the new settings panel options, often hiding advanced versions of the simple options exposed in the panel.
[^settingsexposed]: Though, of course, Linux is also often the _only_ system exposing these fractures to the end user since it is the only one allowing such tinkering in the first place. While a lot can be accomplished through a combination of Windows control panel settings and registry entries and, as I understand it, the MacOS command line, deeper changes are just locked of and not accessible. There is no world where I can see an improvement in complete locked-off-ness over highly visible and cautioning warnings but retaining the possibility for change.
[^developerblame]: Which I would never do --- their work is appreciated and their results are grand. If I had both a little more free time and knowledge of the codebase I would love to contribute back.
