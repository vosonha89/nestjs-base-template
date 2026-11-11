import { AppEnvironment } from './app-environment.enum';
import { appConfig, dbConfig, jwtConfig } from './configuration';
import { validateEnvironment } from './env.validation';

describe('configuration', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	describe('appConfig', () => {
		it('should fall back to sensible defaults', () => {
			delete process.env.APP_PORT;
			delete process.env.APP_NAME;
			delete process.env.NODE_ENV;

			const config = appConfig();

			expect(config.port).toEqual(3001);
			expect(config.name).toEqual('nestjs-api-template');
			expect(config.env).toEqual(AppEnvironment.DEVELOPMENT);
			expect(config.swaggerEnabled).toBe(true);
		});

		it('should parse numeric and list values', () => {
			process.env.APP_PORT = '4100';
			process.env.CORS_ORIGINS = 'http://a.io, http://b.io ,';
			process.env.THROTTLE_LIMIT = '120';

			const config = appConfig();

			expect(config.port).toEqual(4100);
			expect(config.corsOrigins).toEqual(['http://a.io', 'http://b.io']);
			expect(config.throttleLimit).toEqual(120);
		});

		it('should fall back to development for an unknown environment', () => {
			process.env.NODE_ENV = 'staging-typo';

			expect(appConfig().env).toEqual(AppEnvironment.DEVELOPMENT);
		});
	});

	describe('dbConfig', () => {
		it('should never allow synchronize', () => {
			process.env.DB_SYNC = 'true';

			expect(dbConfig().synchronize).toBe(false);
		});

		it('should validate the certificate chain by default', () => {
			delete process.env.DB_SSL_REJECT_UNAUTHORIZED;

			expect(dbConfig().sslRejectUnauthorized).toBe(true);
		});

		it('should parse the boolean flags', () => {
			process.env.DB_SSL = 'true';
			process.env.DB_LOGGING = '1';

			const config = dbConfig();

			expect(config.ssl).toBe(true);
			expect(config.logging).toBe(true);
		});
	});

	describe('jwtConfig', () => {
		it('should keep the secret empty when the variable is absent', () => {
			delete process.env.JWT_SECRET;

			expect(jwtConfig().secret).toEqual('');
		});
	});

	describe('validateEnvironment', () => {
		/** Minimal valid environment. */
		const validEnv = (): Record<string, unknown> => ({
			APP_NAME: 'test',
			APP_PORT: '3001',
			APP_VERSION: '1.0.0',
			API_PREFIX: 'api',
			API_DEFAULT_VERSION: '1',
			SWAGGER_ENABLED: 'true',
			SWAGGER_PATH: 'api/doc',
			DB_HOST: 'localhost',
			DB_PORT: '5432',
			DB_USERNAME: 'postgres',
			DB_PASSWORD: 'postgres',
			DB_DATABASE: 'test',
			DB_SSL: 'false',
			JWT_SECRET: 'a'.repeat(32),
			JWT_EXPIRES_IN: '1d',
			CORS_ORIGINS: '*'
		});

		it('should accept a valid environment', () => {
			expect(() => validateEnvironment(validEnv())).not.toThrow();
		});

		it('should reject a JWT secret shorter than 32 characters', () => {
			const env = { ...validEnv(), JWT_SECRET: 'too-short' };

			expect(() => validateEnvironment(env)).toThrow(/JWT_SECRET/);
		});

		it('should reject a non numeric port', () => {
			const env = { ...validEnv(), APP_PORT: 'not-a-port' };

			expect(() => validateEnvironment(env)).toThrow(/APP_PORT/);
		});

		it('should reject an invalid JWT lifetime', () => {
			const env = { ...validEnv(), JWT_EXPIRES_IN: 'forever' };

			expect(() => validateEnvironment(env)).toThrow(/JWT_EXPIRES_IN/);
		});
	});
});
