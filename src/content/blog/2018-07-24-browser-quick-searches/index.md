---
title: "Browser Quick Actions with the Address Bar"
description: "Enabling lighning quick bookmarks and searches for your browser"
pubDate: 2018-07-23T15:52:47+02:00
weight: 10
draft: false
tags:
  - browser
---

## The Idea

The adress bar in your browser is one of the places your input will most often
go into. For that reason, whenever you open a new window or new tab it will
automatically be selected and waiting for you to input a link.

For that reason also, it is perhaps the perfect place for you to create some
shortcuts for pages you often use, searches you often need and tasks you perform
repeatedly.

<video src="2018-07-23-browser-quick-searches/thesaurus-dict.webm" type="video/webm" loop controls autoplay>
</video>

What we are doing here is simply writing `t TheTermWeWant` into the address bar,
and automagically we are transported to the specific Thesaurus.com page for our
term. Same thing for Dict.cc to translate our term into another language. Things
like this are easily done with custom search engines and nicknames, and contrary
to bookmarklets you don’t really have to write any code.

What we want to do is find custom search engines in our browser options and
create one which is called through a short code and points to the page – only
with no specific search but the substitution for whatever we type after our
code.

## The Basic Implementation

Most modern browsers support custom search engines. I am using Vivaldi which is
based off Chrome. I know that Firefox supports them and even Internet Explorer
does so to a limited degree!

The steps are easy. First, find the page you want to create a shortcut to and
search something on it. Then copy your whole adress bar – as you can see it will
contain the word you just searched for.

<video src="2018-07-23-browser-quick-searches/thesaurus-copy-term.webm" type="video/webm" loop controls autoplay>
</video>

In our case this gives us `https://www.thesaurus.com/browse/shortcut?s=t`

Then just remove the word and replace it with `%s`. This gives us
`https://www.thesaurus.com/browse/%s?s=t`

Finally, go to your browser settings and find ‘Search’ (on Chrome and Vivaldi).
The steps for Firefox browsers are detailed.

Then just fill out the name and set a concise ‘nickname’, which will then be
used as your shortcut. Paste the url you just created with the %s as your term
and hit save.

<video src="2018-07-23-browser-quick-searches/thesaurus-set-options.webm" type="video/webm" loop controls autoplay>
</video>

That's it, you can already start using your new custom 'search' engine! If you
want some ideas on how use this, take a look at my search engines above. Most
should be self-explanatory: translate translates a word, subreddit quickly surfs
to a specific subreddit, stackoverflow searches for answers and AlternativeTo
gives the alternative programs to the one entered.

## Shortcuts to your Bookmarks

Additionally, you can give your bookmarks ‘nicknames’ to be able to reach them
through shortcuts. Personally, I don’t use bookmarks nearly as much anymore but
I do use a couple of bookmarklets which serve specific functions for me.

For example, I use [Shaarli](https://github.com/shaarli/Shaarli) to pin
interesting links I found to my private little version of Pinterest. Shaarli
provides a bookmarklet with which to add links to your instance without being on
the site itself – and we can turn it into an incredibly fast saving with
nicknames.

Here is the code to add something to shaarli, simply put that as the ‘address’
of your bookmark:

```javascript
javascript:(function(){var%20url%20=%20location.href;var%20title%20=%20document.title%20||%20url;var%20desc=document.getSelection().toString();if(desc.length>4000){desc=desc.substr(0,4000)+'...';alert('The%20selected%20text%20is%20too%20long,%20it%20will%20be%20truncated.');}window.open('https://THELINK.TOYOURSHAAR.LI/?post='%20+%20encodeURIComponent(url)+'&title='%20+%20encodeURIComponent(title)+'&description='%20+%20encodeURIComponent(desc)+'&source=bookmarklet','_blank','menubar=no,height=800,width=600,toolbar=no,scrollbars=yes,status=no,dialog=1');})();
```

I gave it the nickname `s` and that is all I have to type to get a link into
Shaarli now.

If you change the `window.location.assign` to `window.open` in the code above,
it will open as a little popup instead, leaving you free to continue browsing
the site you are on. I have added that as a bookmark as well and given it the
nickname `ss`, so I always have both options.

## Expanding the idea

Well, now you know the idea. My purposes for its usage are tame. But perhaps you
want to know the way to a specific place from your home adress? Just use:

`http://maps.google.com/maps?f=q&source=s_q&hl=en&q=from+home+to+%s`

And replace home with your actual address. Or, if you actually set a home in
google maps, leave it as is and it will always use your actual home address.
just nickname is something short like `m` and you’re good to go.

If you want to get even more fancy – since you can put essentially any
javascript into the address bar – you can even let if find out your current
location and give you directions from there. Doing so is a bit beyond the scope
of this post, and it is really well documented by `mdegat01`, who created a
small
[javascript bookmarklet](https://web.archive.org/web/20130108072145/http://jsfiddle.net/mdegat01/WSLak/)
to use.

A whole array of ideas can be found in the comments of
[this lifehacker post](https://lifehacker.com/5971527/what-are-your-favorite-custom-web-searches),
from searching youtube, adding events to your calendar to shortening URLs.

## Quick Examples – Timer and QuickBrowse

Let’s quickly do two more things before we leave. If you sometimes put something
in the oven, head to your computer and start browsing, only to forget the time
and burn whatever precious baked goods you magic’d together – why not set a
timer through your address bar?

Just use `http://cd.justinjc.com/%s` and set it to a nice shortcut (I use `c`
since I am a big fan of one-letter shortcuts; you could use `time` or `clock`).
Then, enter the shortcut, and any combination of 24H60M60S to set an alarm that
far in the future. So, 1h30m will let you watch a movie and then remember the
oven. If you only put a single number it will automatically be converted to
minutes. In other words, you only have to type `c 12` so you don’t forget your
pizza.

Finally, if you want to quickly browse to certain parts of a website where you
essentially know how they titled it but don#t want to type the whole link, or
only roughly know the exact address, use
`http://www.google.com/search?ie=UTF-8&oe=UTF-8&sourceid=navclient&gfns=1&q=%s`
with a shortcut.[^1] It will get you where you want to go with surprisingly high
accuracy – so termed it the fancyful ‘QuickBrowse’ in my search engines. All
credit to `chattphotos,` who posted it as a reply in the abovementioned comment
thread.

Well, that’s it. Go out and define your own search engines, and shave those
precious few seconds off your browsing time. You will make them right back up by
stubbornly integrating more and more search terms, until you forgot half of
them. I know I did.

[^1]: This only works for dns services that do not do recursive lookups, as the creator noted.
