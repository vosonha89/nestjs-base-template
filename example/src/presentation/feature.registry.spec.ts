import { FEATURE_MODULES, SWAGGER_TAGS } from './feature.registry';

/**
 * Contract-level assertions only: this file is byte-identical in `template/`
 * and `example/`, whose registries hold different contents.
 */
describe('presentation feature registry', () => {
	it('should keep the feature module list as an array', () => {
		expect(Array.isArray(FEATURE_MODULES)).toBe(true);
	});

	it('should always tag the health probe, which every app mounts', () => {
		expect(SWAGGER_TAGS).toContain('health');
	});

	it('should never declare the same tag twice', () => {
		expect(new Set(SWAGGER_TAGS).size).toEqual(SWAGGER_TAGS.length);
	});
});
