import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			'@config': resolve(__dirname, '../src/config'),
			'@common': resolve(__dirname, '../src/common'),
			'@data': resolve(__dirname, '../src/data'),
			'@services': resolve(__dirname, '../src/services'),
			'@presentation': resolve(__dirname, '../src/presentation'),
			'@test': resolve(__dirname, '.'),
		},
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['test/**/*.e2e-spec.ts'],
	},
});
