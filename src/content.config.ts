import { z, defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";

// all from https://docs.astro.build/en/guides/content-collections/
const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./content/" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(
      z.enum([
        "anki",
        "blog",
        "browser",
        "commandline",
        "dart",
        "docker",
        "fzf",
        "git",
        "hosting",
        "hugo",
        "jujutsu",
        "kotlin",
        "libgdx",
        "linux",
        "nextcloud",
        "notes",
        "opensource",
        "personal",
        "privacy",
        "programming pattern",
        "python",
        "sql",
        "ssh",
        "taskwarrior",
      ]),
    ),
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

export const collections = { blog };
