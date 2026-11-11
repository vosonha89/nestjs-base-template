import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configureApplication } from './app.setup';
import { AppEnvironment } from './config/app-environment.enum';
import { IAppConfig } from './config/config.type';

/**
 * Builds a resolved application configuration fixture.
 * @param overrides - Fields to replace
 * @returns The fixture
 */
function appConfig(overrides: Partial<IAppConfig> = {}): IAppConfig {
	return {
		env: AppEnvironment.DEVELOPMENT,
		name: 'test-api',
		port: 3001,
		version: '1.0.0',
		apiPrefix: 'api',
		apiDefaultVersion: '1',
		swaggerEnabled: true,
		swaggerPath: 'api/doc',
		corsOrigins: ['http://localhost:3000'],
		throttleTtl: 60,
		throttleLimit: 60,
		...overrides
	};
}

/**
 * Builds a stub Nest application recording every call.
 * @param config - Configuration the stubbed `ConfigService` resolves
 * @returns The stub
 */
function createApp(config: IAppConfig) {
	return {
		get: jest.fn(() => ({ getOrThrow: jest.fn(() => config) })),
		use: jest.fn(),
		enableCors: jest.fn(),
		setGlobalPrefix: jest.fn(),
		enableVersioning: jest.fn(),
		enableShutdownHooks: jest.fn()
	};
}

describe('configureApplication', () => {
	it('should return the resolved configuration', () => {
		const config = appConfig();
		const app = createApp(config);

		expect(configureApplication(app as never)).toBe(config);
	});

	it('should install helmet', () => {
		const app = createApp(appConfig());

		configureApplication(app as never);

		expect(app.use).toHaveBeenCalledTimes(1);
	});

	it('should reflect a concrete CORS allowlist', () => {
		const app = createApp(appConfig({ corsOrigins: ['http://a.io', 'http://b.io'] }));

		configureApplication(app as never);

		expect(app.enableCors).toHaveBeenCalledWith(
			expect.objectContaining({ origin: ['http://a.io', 'http://b.io'], credentials: true })
		);
	});

	it('should mirror any origin when the allowlist is a wildcard', () => {
		const app = createApp(appConfig({ corsOrigins: ['*'] }));

		configureApplication(app as never);

		expect(app.enableCors).toHaveBeenCalledWith(expect.objectContaining({ origin: true }));
	});

	it('should keep the health probe outside the API prefix', () => {
		const app = createApp(appConfig());

		configureApplication(app as never);

		expect(app.setGlobalPrefix).toHaveBeenCalledWith('api', {
			exclude: [{ path: 'health', method: RequestMethod.GET }]
		});
	});

	it('should enable URI versioning with the configured default', () => {
		const app = createApp(appConfig({ apiDefaultVersion: '2' }));

		configureApplication(app as never);

		expect(app.enableVersioning).toHaveBeenCalledWith(expect.objectContaining({ defaultVersion: '2' }));
	});

	it('should enable shutdown hooks so SIGTERM drains the pool', () => {
		const app = createApp(appConfig());

		configureApplication(app as never);

		expect(app.enableShutdownHooks).toHaveBeenCalledTimes(1);
	});

	it('should read the configuration through ConfigService, never process.env', () => {
		const app = createApp(appConfig());

		configureApplication(app as never);

		expect(app.get).toHaveBeenCalledWith(ConfigService);
	});
});
