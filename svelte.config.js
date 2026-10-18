import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		version: {
			name: process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'cavira-local'
		},
		// https://svelte.dev/docs/kit/adapters
		adapter: adapter({
			pages: 'build',
            assets: 'build',
            precompress: true,
            strict: true
		}),
		prerender: {
			entries: ['*'],
			handleHttpError: 'ignore'
		},
		files: {
			routes: './views/pages',
			appTemplate: './views/app.html',
			lib: './views'
		}
	}
};

export default config;
