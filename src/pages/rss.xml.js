import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { BASE_URL } from "../data/constants";

import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt();

export async function GET() {
  const entries = await getCollection("blog");
  return rss({
    stylesheet: "/rss/style.xsl",
    title: "Marty's blog",
    description: "Deep dives into uncertainty",
    site: BASE_URL,
    trailingSlash: false,
    items: entries
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/blog/${post.id}`,
        content: sanitizeHtml(parser.render(post.body), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
        }),
      }))
      .sort((a, b) => b.pubDate - a.pubDate).slice(0,50),
    customData: `<language>en-us</language>`,
  });
}
