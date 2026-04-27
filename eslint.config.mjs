// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['eslint.config.mjs'],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
			sourceType: 'commonjs',
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			'object-curly-spacing': ['error', 'always'],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-unsafe-argument': 'error',
			"@typescript-eslint/no-unsafe-member-access": "error",
			"@typescript-eslint/no-unsafe-assignment": "error",
			"@typescript-eslint/no-unsafe-call": "error",
			"@typescript-eslint/no-this-alias": [
				"error",
				{
					"allowDestructuring": true, // Allow `const { props, state } = this`; false by default
					"allowedNames": ["me"] // Allow `const me= this`; `[]` by default
				}
			]
		},
	},
	{
		files: ['**/*.spec.ts'],
		rules: {
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
		},
	}
);
