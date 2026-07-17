import { plugin } from 'bun';

plugin({
	name: 'sveltekit-virtual-modules',
	setup(build) {
		build.module('$env/static/private', () => ({
			exports: {
				DATABASE_URL: process.env.DATABASE_URL,
				DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN
			},
			loader: 'object'
		}));
		build.module('$app/environment', () => ({
			exports: { dev: false, browser: false, building: false, version: '' },
			loader: 'object'
		}));
	}
});
