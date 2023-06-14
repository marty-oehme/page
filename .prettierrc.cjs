/** @type {import("@types/prettier").Options} */
module.exports = {
	printWidth: 100,
	semi: true,
	plugins: [
		require("prettier-plugin-astro"),
		require("prettier-plugin-tailwindcss") /* Must come last */,
	],
	pluginSearchDirs: false,
	overrides: [
		{
			files: "**/*astro",
			options: {
				parser: "astro",
			},
		},
	],
};
