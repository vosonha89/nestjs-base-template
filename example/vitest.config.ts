import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			'@config': resolve(__dirname, './src/config'),
			'@common': resolve(__dirname, './src/common'),
			'@data': resolve(__dirname, './src/data'),
			'@services': resolve(__dirname, './src/services'),
			'@presentation': resolve(__dirname, './src/presentation'),
			'@test': resolve(__dirname, './test'),
		},
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.spec.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'json-summary'],
			include: ['src/**/*.ts'],
			exclude: [
				'src/main.ts',
				'src/**/*.module.ts',
				'src/**/index.ts',
				'src/data/migration/**',
				'src/data/seed/**',
				'src/data/data-source.ts',
				'src/**/*.interface.ts',
				'src/**/*.type.ts',
			],
			thresholds: {
				global: {
					branches: 70,
					functions: 55,
					lines: 75,
					statements: 75,
				},
			},
		},
	},
});
