import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";

export function remarkReadingTime() {
  return function (tree, { data }) {
    const text = toString(tree);
    const readingTime = getReadingTime(text);
    data.astro.frontmatter.readingTime = readingTime.text;
    data.astro.frontmatter.words = readingTime.words;
  };
}
