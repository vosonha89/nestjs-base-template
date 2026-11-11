// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Shared layer-boundary helper.
 * Keeps the N-layer dependency direction one-way: presentation -> services -> data -> common -> config.
 * @param {string} message - Human readable explanation shown when the rule fires.
 * @param {string[]} group - Import patterns that must not be used.
 * @returns {import('eslint').Linter.RuleEntry} The configured `no-restricted-imports` entry.
 */
const denyImports = (message, group) => ['error', { patterns: [{ group, message }] }];

export default tseslint.config(
	{
		ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'eslint.config.mjs']
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest
			},
			sourceType: 'commonjs',
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		}
	},
	{
		rules: {
			/* ── Type safety ───────────────────────────────────────── */
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-unsafe-argument': 'error',
			'@typescript-eslint/no-unsafe-assignment': 'error',
			'@typescript-eslint/no-unsafe-call': 'error',
			'@typescript-eslint/no-unsafe-member-access': 'error',
			'@typescript-eslint/no-unsafe-return': 'error',
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{ allowNumber: true, allowBoolean: true }
			],

			/* ── OOP restrict (see .clinerules/rule.md) ────────────── */
			'@typescript-eslint/explicit-member-accessibility': [
				'error',
				{ accessibility: 'explicit' }
			],
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{ allowExpressions: true }
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			],

			/* ── Pragmatic relaxations ─────────────────────────────── */
			'@typescript-eslint/consistent-type-imports': 'off',
			'@typescript-eslint/require-await': 'off',
			'@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
			'@typescript-eslint/no-extraneous-class': 'off',

			/* ── Formatting handled by Prettier ────────────────────── */
			'object-curly-spacing': ['error', 'always']
		}
	},

	/* ── Layer boundaries ──────────────────────────────────────── */
	{
		files: ['src/config/**/*.ts'],
		rules: {
			'no-restricted-imports': denyImports(
				'Layer violation: config must not depend on any other layer.',
				['@common/*', '@data/*', '@services/*', '@presentation/*']
			)
		}
	},
	{
		files: ['src/common/**/*.ts'],
		rules: {
			'no-restricted-imports': denyImports(
				'Layer violation: common must not depend on data, services or presentation.',
				['@data/*', '@services/*', '@presentation/*']
			)
		}
	},
	{
		files: ['src/data/**/*.ts'],
		rules: {
			'no-restricted-imports': denyImports(
				'Layer violation: data must not depend on services or presentation.',
				['@services/*', '@presentation/*']
			)
		}
	},
	{
		files: ['src/services/**/*.ts'],
		rules: {
			'no-restricted-imports': denyImports(
				'Layer violation: services must not depend on presentation.',
				['@presentation/*']
			)
		}
	},
	{
		files: ['src/presentation/**/*.ts'],
		rules: {
			'no-restricted-imports': denyImports(
				'Layer violation: presentation must not touch the data layer directly. Go through a service (@services/*).',
				['@data/*']
			)
		}
	},

	/* ── Base factories ────────────────────────────────────────── */
	{
		// These factories return anonymous abstract classes whose exact type cannot be
		// expressed without dropping the `protected constructor` guarantee, so the
		// explicit return-type rule is disabled for them only. See ARCHITECTURE.md.
		files: ['src/common/base/base-data.controller.ts'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'off'
		}
	},

	/* ── Generated migrations ──────────────────────────────────── */
	{
		// `migration:generate` emits plain classes with implicit accessibility and
		// no explicit return types on the `up`/`down` arrows it inlines. Reformatting
		// them by hand would create noise in every future diff.
		files: ['src/data/migration/**/*.ts'],
		rules: {
			'@typescript-eslint/explicit-member-accessibility': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},

	/* ── Tests ─────────────────────────────────────────────────── */
	{
		files: ['**/*.spec.ts', 'test/**/*.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/explicit-member-accessibility': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/unbound-method': 'off'
		}
	},

	eslintConfigPrettier
);