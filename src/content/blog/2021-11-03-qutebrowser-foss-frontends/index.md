---
title: "Using alternative webpage frontends in qutebrowser"
description: "Automatically switching youtube and co for their FOSS alternatives"
pubDate: "2021-11-03T15:00:00+0200"
weight: 10
tags: [ "qutebrowser" ]
---

In case you don't know, [qutebrowser](https://qutebrowser.org/) is a highly extensible,
vim-keys-by-default open source browser that can basically be fully operated without mouse.
It is also coded in python and can be configured and extended in python as well
(though scripts can be written in any langauge desired).

In this quick explanation I use some of the exposed python API of the browser to
make it easy and painless to use YouTube, Twitter, Reddit, and Instagram[^insta] through their
open source front-ends Invidious, Fritter, Teddit, and Bibliogram, respectively.

[^insta]: Instagram is here more for demonstrative purposes than anything.
I do not use the software, and have no idea how well its replacement behaves.

## The idea

All four of the alternatives allow accessing the underlying content of the platforms
without needing to actually use their front-ends,
which are often extensively dependent on quite a bit of JavaScript,
loaded with ads and dark patterns,
and generally not aimed at maximizing *your* utility,
but that of the companies' capital stakeholders.

Thus, we will simply switch out the way we look at for example youtube ---
using invidious instead of the `youtube.com` interface ---
while still having access to all the videos available on the platform.
We will use qutebrowser's capabilities to quickly implement a solution in just a couple of lines
to automate this process so you never have to think about it again.

## The implementation

The largest part of qutebrowser's settings are applied through `config.py` in your XDG-standards observant configuration directory.
So, open `~/.config/qutebrowser/config.py` or your equivalent file and include the following code:

```python
def rewrite(request: interceptor.Request):
    if (
        request.resource_type != interceptor.ResourceType.main_frame
        or request.request_url.scheme() in {"data", "blob"}
    ):
        return

    url = request.request_url
    if redirects.get(url.host()) is not None and url.setHost(redir) is not False:
        try:
            request.redirect(url)
        except:
            pass


interceptor.register(rewrite)
```

This creates a function which takes in a request object
and registers it as an interceptor in the browser.
Interceptors are essentially called whenever qutebrowser is told to go somewhere through the address bar.
Our little interceptor then takes a closer look at the URL to be surfed to and compares its host address to an entry in the `redirects` dictionary.

The redirects dictionary is up to you,
but to use the aforementioned service front-ends it can look something like this:

```python
redirects = {
    "reddit.com": "teddit.net",
    "youtube.com": "yewtu.be",
    "twitter.com": "nitter.net",
    "instagram.com": "bibliogram.art",
}
```

The full code in its current incarnation can be found in the qutebrowser settings of my [dotfiles](https://gitlab.com/marty-oehme/dotfiles),
the redirection of which is currently situated [here](https://gitlab.com/marty-oehme/dotfiles/-/blob/main/qutebrowser/.config/qutebrowser/url.py).

There is one clear weakness in this approach:

If one of the alternative front-end websites goes down,
all your requests are being sent into nothingness.
A more robust redirection script could take note of this and choose an alternative front-end out of a list of options.
Since all the front-ends are open source and can be self-hosted,
there are a variety of different instances to choose from for each,
or you could even host your own.
Ultimately though, I have been using the official instances for multiple months now without any hiccups ---
it's been smooth sailing on light-weight front-end for me ever since I used this little snippet.

## The conclusion

Where does this all leave us?

Obviously, I would much prefer to use fully federated,
open source platforms instead of their monopolized alternatives.
However, exactly therein often lies the difficulty ---
their monopoly allows them prime access to and possession of the majority of user generated content which is in turn inaccessible on other platforms.
I switched where possible, mainly for [mastodon](https://joinmastodon.org/) (~~twitter~~) and [lemmy](https://join-lemmy.org/) (~~reddit~~).
I rarely use Twitter and never Instagram anyway,
but should the need arise my browser will now instantly redirect me to much more accessible, light-weight and,
often, less attention-grabbing alternative views into their data.

In an ideal world we could also promote services like [pixelfed](https://pixelfed.org/), [peertube](https://joinpeertube.org/en), and [friendica](https://friendi.ca/).
Realistically, I am probably too much of a social media curmudgeon to be of much help there,
so see this blog post as the next-best thing I can offer.
Afterwards, you never have to think about a thing and can offload all the manual switching of hosts to the one thing directly designed for it ---
your browser.
