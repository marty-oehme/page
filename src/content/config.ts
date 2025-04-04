import { z, defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";

// all from https://docs.astro.build/en/guides/content-collections/
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: ".src/content/blog/" }),
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
        "jujutsu",
        "hosting",
        "hugo",
        "kotlin",
        "libgdx",
        "linux",
        "nextcloud",
        "notes",
        "opensource",
        "privacy",
        "programming pattern",
        "python",
        "rambling",
        "ssh",
        "sql",
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
