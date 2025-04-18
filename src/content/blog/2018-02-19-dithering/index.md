---
pubDate: "2018-02-19T09:00:00+0200"
linktitle: "Dithering"
title: "Dithering about in Dart"
description: "Floyd-Steinberg Dithering in an HTML5 Canvas"
weight: 10
draft: false
hidden: false
tags:
  - dart
---

## Floyd-Steinberg Dithering in an HTML5 Canvas

[![Dithered Lionhead](./lionhead.png)](2018-02-19/lionhead.png)

## The Effect

Recently, I had time to dive into some light programming projects again. One of
the first was a simple algorithmic image transform with Dithering. Wikipedia
calls [Dithering](https://en.wikipedia.org/wiki/Dither) “an intentionally
applied form of noise used to randomize quantization error”, and while that is
true and very concise, it also sheds little light on what is actually happening.

What is actually happening is the image being parted into either fully black
regions, or fully white regions (at least for b&w images - for colored images it
does the same process for every color individually). The error between what the
actual color of the pixel was, and what it is now is then pushed onto the pixels
next to it, in addition to their normal color. They then in turn get parted (or
'thresholded') into fully black or white pixels and again, the error between
what is either fully black or white, and what the actual color (plus the error
of its neighboring pixels) is - is then again pushed onto its neighbors. Thus,
it creates small clumps of black, and small clumps of white intermittently,
depending on if the previous pixels where lighter or darker - and what the
previous clump was.

[![A Colored Dither Image](./spices.png)](2018-02-19/spicesbig.png)

So, if you have a very light pixel and a white a white threshold for the
previous pixel, it will also be created as a white pixel and not much error will
result. If you have a lot of error from the previous pixel on the other hand,
this can _flip_ the color of a light or dark pixel to its opposite end in the
final thresholded black, or white result - which would then in turn propagate a
big error in the opposite direction to the next pixel. This is where the typical
'dithered' effect is created. Areas on a picture which contain a rapid change
from dark to light will be where the little dots clump intermittently white and
black, because a lot of error will be returned from the pixels on the
'mid-level' of the lightness spectrum - i.e. the pixels in the middle of this
change. Areas that are already dark in the original picture will stay
predominantly black, with a white dot here or there if the error ever gets too
big, same for light areas. For these areas, the effect is largely that of a
simple threshold operation. Most of the dithering magic happens where lightness
(or color) changes.

[![Different Dithering Strengths in Dark and Light Ares](./cats_sidebyside.png)](2018-02-19/cats_sidebyside.png)

## The Process

In practice, this process often quantizes the images first.
[Quantization](<https://en.wikipedia.org/wiki/Quantization_(image_processing)>)
is something regularly used in image processing, and also what sometimes leads
to highly compressed pictures looking very 'jpeg'. Quantization is not far from
thresholding processes - It parts the image in whatever many steps, or cuts, one
puts in. If there is only one step, it will simply be cut in the middle and thus
what is created is essentially a threshold. Everything under half lightness
becomes black, everything lighter becomes white. Now, Dithering does not just
work with black and white values. You can pass in a different amount of steps
and the different thresholds it will look for will change accordingly. If we
pass in 2 steps, the image will now be split in three distinct lightness values
during the quantization process (remember - 2 cuts make three colors): We create
a cut at, let's say, 1/3rd and 2/3rds of lightness and the resulting three
values are what the actual lightness value of a pixel will be compared against.
This will still lead to the dithering effect described above, but already much
less pronounced, since the errors in general are smaller than if we only created
black or white values. Thinking this through to its conclusion, if we input 255
steps for the quantization, nothing will change as the different lightness
plateaus created by it align exactly with the colors that already existed in
this (RGB) image.

[![An Original, undithered input image](./orig.png)](2018-02-19/orig.png)

Now, the error propagation does not only exist from one pixel to the next.
Rather, at least in the
[Floyd-Steinberg variant](https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering)
of this effect, the errors are propagated to the pixel on the current pixel's
right, bottom-left, bottom-center, and bottom-right. So, it diffuses the error
processes into _all_ neighboring pixels if we start from the top left pixel of
an image. The actual pixels are still examined in order, going from one to the
right to the next and so on (or down, then right - both work). But the errors
are more diffused.

[![The Final, Dithered Cat](./dithcat.png)](2018-02-19/dithcat.png)

As already evident a couple times, especially on the header image of this post;
the algorithm works better for some pictures than others. Especially when
confronted with the artifacts of an already compressed jpeg image which contains
almost exclusively white background, it tends to introduce lines of dots where
there really shouldn't be any - often called snake lines - due to the fact that
at some point the small errors between the white on the image and the completely
pure white created by the threshold accumulate. And pile on enough errors, and
you will reverse the quantized color of a pixel, even if it is actually almost
white. It will also stand on its own, since the next image will quickly revert
to white. When confronted with large, similarly-colored areas, the faulty pixels
will generally be close to each other since the errors accumulate in similar
patterns. Thus, snake patterns.

[![Dithering Errors creating snake lines](./lion_dth_errors.png)](2018-02-19/lion_dth_errors.png)

## Where to go from here

I will try to follow up with some code examples and possibly some interactive
demonstrations of the effect if I get the time. It is fun to watch it work and
play around with different quantizations, different neighboring error weights
and perhaps even different sequences of assigning errors altogether. Right now,
the application is very bare-bones and only reads a hard-coded image from a
static image repository. It would obviously be more fun to load your own images
and play around with that. Finally, I realize Canvas pixel operations, which
this is all based on, are generally not very fast. I have not played around with
optimizations and doubt this process would work for a gif or video, as it
stands. That would really be work for another day however, and unfortunately I
do not think I have the time to accomplish this currently.

If you want to see a (quick) implementation of this algorithm in video form,
look no further than the excellent Daniel Shiffman
[on Youtube](https://youtu.be/0L2n8Tg2FwI), who inspired me to play around with
the algorithm in the first place.

The complete source code as it stands currently can be
[found here](https://gitlab.com/marty.oehme/floyd-steinberg-dithering) - though
fair warning, it is of course a bit of a mess after my quick experimentation and
messing around. I might come back to it, and make an actual worthwile bit of
code out of it at some point.
