import { z, defineCollection, reference } from "astro:content";
import { glob, file } from "astro/loaders";
import { normalizeTag } from "./data/tags";

// Shared by blog posts and projects so a tag written on either side compares
// equal: trimmed, lowercased and whitespace-collapsed, never empty.
const blogTag = z.string().transform(normalizeTag).pipe(z.string().min(1));

// all from https://docs.astro.build/en/guides/content-collections/
const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./content/" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    type: z.enum(["technical", "essay", "analysis", "note"]).optional(),
    topics: z
      .array(
        z.enum([
          "command-line",
          "data",
          "hosting-infrastructure",
          "knowledge-management",
          "linux",
          "open-source",
          "python",
          "programming",
          "task-management",
          "version-control",
        ]),
      )
      .min(1),
    tags: z.array(blogTag).default([]),
    series: z
      .object({
        id: z.string().trim().min(1),
        // Display name; declared once, on the series' first main entry.
        name: z.string().trim().min(1).optional(),
        // Integers are main entries; fractional values order supplementary articles.
        order: z.number().finite().positive(),
      })
      .optional(),
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
    draft: z.boolean().optional(),
    weight: z.number().optional(),
    language: z.enum(["en", "de"]).optional(),
    relatedPosts: z.array(reference("blog")).optional(),
  }),
});

const projects = defineCollection({
  loader: file("./content/projects.yaml"),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    // Sorting mechanism on projects listing
    status: z.enum(["main", "weekend", "unmaintained"]),
    // Long-form text description
    description: z.string(),
    // Blog tags whose posts belong in this project's orbit, renders small
    // 'linked writing' links on the projects page
    blogTags: z.array(blogTag).optional(),
    links: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
          variant: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = { blog, projects };
