/**
 * Curated blog entries eligible for the Featured section. Add a post here when
 * it fits the featured criteria; the newest entries by publication date are
 * the ones actually shown.
 */
export const FEATURED_POST_IDS = [
  "2025-12-13-popcorn-analysis",
  "2025-09-01-python-footguns",
  "2025-03-29-projects-and-tags",
  "2024-02-07-zk-in-my-notetaking",
  "2024-01-24-select-star-sql",
] as const;

/** How many of the newest featured entries to display. */
export const FEATURED_POST_COUNT = 3;
