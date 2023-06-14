module.exports = {
  printWidth: 100,
  semi: true,
  plugins: [
    require.resolve("prettier-plugin-astro"),
    require.resolve("prettier-plugin-tailwindcss") /* Must come last */,
  ],
  pluginSearchDirs: [__dirname],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
};
