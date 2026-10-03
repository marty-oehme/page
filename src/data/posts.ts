import { getCollection, type CollectionEntry } from "astro:content";
import { PUBLISH_DRAFTS } from "astro:env/server";

export type BlogEntry = CollectionEntry<"blog">;

/**
 * Whether draft entries should be part of the site.
 *
 * Development always includes drafts so they can be previewed locally. A
 * production build excludes them unless `PUBLISH_DRAFTS=true` is set, which is
 * useful for previewing a deploy that contains drafts.
 */
const showDrafts = !import.meta.env.PROD || PUBLISH_DRAFTS;

/**
 * Every blog entry that belongs on the public site.
 *
 * Single source of truth for draft filtering, shared by the archive, topic and
 * tag pages, the post routes and the RSS feed.
 */
export async function getPublishedPosts(): Promise<BlogEntry[]> {
  return getCollection("blog", ({ data }) => showDrafts || data.draft !== true);
}
