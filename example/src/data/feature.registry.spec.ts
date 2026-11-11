import { ENTITIES, REPOSITORY_EXPORTS, REPOSITORY_PROVIDERS } from './feature.registry';

/**
 * These assertions describe the contract of the registry itself, not its
 * contents: `template/` ships it empty and `example/` populates it, yet this
 * spec is byte-identical in both folders. Asserting "is empty" here would make
 * the synchronised copy fail the moment a feature is added.
 */
describe('data feature registry', () => {
	it('should keep the entity list as an array', () => {
		expect(Array.isArray(ENTITIES)).toBe(true);
	});

	it('should export exactly one injection token per repository provider', () => {
		expect(REPOSITORY_EXPORTS).toHaveLength(REPOSITORY_PROVIDERS.length);
	});

	it('should register every repository as a class provider with a token', () => {
		for (const provider of REPOSITORY_PROVIDERS) {
			const candidate = provider as unknown as Record<string, unknown>;

			expect(candidate).toHaveProperty('provide');
			expect(candidate).toHaveProperty('useClass');
		}
	});
});
