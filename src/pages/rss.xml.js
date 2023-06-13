import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { BASE_URL } from "../data/constants";

export async function get() {
    const entries = await getCollection('blog');
  return rss({
    title: "Marty's blog",
    description: "Deep dives into uncertainty",
    site: BASE_URL,
    items: entries.map((post) => ({
            title: post.data.title,
            description: post.data.description,
            pubDate: post.data.pubDate,
            link: `/blog/${post.slug}`,
        })),
    customData: `<language>en-us</language>`,
  });
}
