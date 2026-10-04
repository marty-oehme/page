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
 * Single source of truth for draft filtering, shared by the Writing page,
 * topic and tag pages, the post routes and the RSS feed.
 */
export async function getPublishedPosts(): Promise<BlogEntry[]> {
  return getCollection("blog", ({ data }) => showDrafts || data.draft !== true);
}

/**
 * Display name for a series, resolved from the first part that declares one.
 *
 * The name is declared once, on a series' first main entry, and falls back to a
 * label derived from the id when no part provides one.
 */
export function getSeriesName(parts: BlogEntry[], id: string): string {
  const named = [...parts]
    .sort((a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0))
    .find((part) => part.data.series?.name);
  return named?.data.series?.name ?? id.replace(/[-_]+/g, " ");
}

export interface SeriesPart {
  entry: BlogEntry;
  /** 1-based position among the main installments, or null for an interlude. */
  partNumber: number | null;
  /** Display label, e.g. "Part 3" or "Interlude". */
  label: string;
}

/**
 * Label a series' entries for display.
 *
 * Entries are ordered by numeric `series.order`. Integer orders are main
 * installments, numbered 1..N; fractional orders are interludes that slot
 * between main parts without shifting their numbering.
 */
export function describeSeries(parts: BlogEntry[]): SeriesPart[] {
  let partNumber = 0;
  return [...parts]
    .sort((a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0))
    .map((entry) => {
      const order = entry.data.series?.order;
      if (order !== undefined && !Number.isInteger(order)) {
        return { entry, partNumber: null, label: "Interlude" };
      }
      partNumber += 1;
      return { entry, partNumber, label: `Part ${partNumber}` };
    });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Unambiguous short date ("3 Nov 2021"); the year part can be omitted on
 * listings that already group rows by year.
 */
export function formatDate(date: Date, showYear = true): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${showYear ? ` ${date.getFullYear()}` : ""}`;
}
