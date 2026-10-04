/**
 * Canonical form for a blog tag.
 *
 * Tags are matched exactly against the tags declared in projects.yaml, so both
 * sides go through this: trimmed, lowercased and with runs of whitespace
 * collapsed. That way "taskwarrior" or an accidental "Taskwarrior " are
 * the same tag.
 */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, " ");
}

/** URL of the tag page for a tag, in canonical form. */
export function tagUrl(tag: string): string {
  return `/tags/${encodeURIComponent(normalizeTag(tag))}`;
}

/**
 * How many posts carry each tag.
 *
 * Accepts anything with `data.tags`, so it works for blog entries without
 * making this module depend on the content collections.
 */
export function countByTag(
  posts: ReadonlyArray<{ data: { tags: readonly string[] } }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}
