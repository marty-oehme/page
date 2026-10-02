import { z, defineCollection, reference } from "astro:content";
import { glob, file } from "astro/loaders";

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
          "privacy",
          "python",
          "programming",
          "task-management",
          "version-control",
        ]),
      )
      .min(1),
    tags: z.array(z.string().trim().min(1)).default([]),
    series: z
      .object({
        id: z.string().trim().min(1),
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
    maintained: z.boolean(),
    description: z.string(),
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
