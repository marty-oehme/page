import rss, { pagesGlobToRssItems } from '@astrojs/rss'

export async function get() {
    return rss({
        title: "Marty's blog",
        description: "Deep dives into uncertainty",
        site: "https://blog.martyoeh.me",
        items: await pagesGlobToRssItems(import.meta.glob('./**/*.md*')),
        customData: `<language>en-us</language>`,
    });
}
