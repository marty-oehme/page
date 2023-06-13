/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
        colors: {
            primary: '#F40076',
            'primary-focus': '#d00065',
            'primary-content': '#ffd9e2',
            secondary: '#8E4162',
            'secondary-focus': '#763651',
            'secondary-content': '#ead7de',
            accent: '#5c7f67',
            'accent-focus': '#4c5b55',
            'accent-content': '#dce1df',
            neutral: '#291E00',
            'neutral-focus': '#050400',
            'neutral-content': '#d0cdc6',
            'base-100': '#e9e7e7',
            // 'base-200': '#',
            // 'base-300': '#',
            'base-content': '#100f0f',
            'color-scheme': 'light',
        },
	},
	plugins: [require('@tailwindcss/typography')],
}
