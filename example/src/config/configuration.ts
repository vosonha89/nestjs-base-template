import { registerAs } from '@nestjs/config';
import { AppEnvironment } from './app-environment.enum';
import { IAppConfig, IDbConfig, IJwtConfig } from './config.type';

/**
 * Reads a required string variable.
 * @param key - Environment variable name
 * @param fallback - Value used when the variable is absent or blank
 * @returns The resolved string
 */
function readString(key: string, fallback: string): string {
	const value = process.env[key];
	return value === undefined || value.trim() === '' ? fallback : value.trim();
}

/**
 * Reads a numeric variable.
 * @param key - Environment variable name
 * @param fallback - Value used when the variable is absent or not numeric
 * @returns The resolved number
 */
function readNumber(key: string, fallback: number): number {
	const parsed = Number.parseInt(readString(key, String(fallback)), 10);
	return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Reads a boolean flag written as `true`/`false`.
 * @param key - Environment variable name
 * @param fallback - Value used when the variable is absent
 * @returns The resolved boolean
 */
function readBoolean(key: string, fallback: boolean): boolean {
	const value = readString(key, String(fallback)).toLowerCase();
	return value === 'true' || value === '1';
}

/**
 * Reads a comma separated list.
 * @param key - Environment variable name
 * @param fallback - Value used when the variable is absent
 * @returns The resolved list, trimmed and without empty entries
 */
function readList(key: string, fallback: string): string[] {
	return readString(key, fallback)
		.split(',')
		.map((item: string) => item.trim())
		.filter((item: string) => item.length > 0);
}

/**
 * Reads the active environment, defaulting to development.
 * @returns The resolved {@link AppEnvironment}
 */
function readEnvironment(): AppEnvironment {
	const value = readString('NODE_ENV', AppEnvironment.DEVELOPMENT).toLowerCase();
	const isKnown = Object.values(AppEnvironment).some((candidate: string) => candidate === value);
	return isKnown ? (value as AppEnvironment) : AppEnvironment.DEVELOPMENT;
}

/**
 * Application namespace configuration.
 */
export const appConfig = registerAs('app', (): IAppConfig => ({
	env: readEnvironment(),
	name: readString('APP_NAME', 'nestjs-api-template'),
	port: readNumber('APP_PORT', 3001),
	version: readString('APP_VERSION', '1.0.0'),
	apiPrefix: readString('API_PREFIX', 'api'),
	apiDefaultVersion: readString('API_DEFAULT_VERSION', '1'),
	swaggerEnabled: readBoolean('SWAGGER_ENABLED', true),
	swaggerPath: readString('SWAGGER_PATH', 'api/doc'),
	corsOrigins: readList('CORS_ORIGINS', 'http://localhost:3000'),
	throttleTtl: readNumber('THROTTLE_TTL', 60),
	throttleLimit: readNumber('THROTTLE_LIMIT', 60)
}));

/**
 * Database namespace configuration.
 */
export const dbConfig = registerAs('db', (): IDbConfig => ({
	host: readString('DB_HOST', 'localhost'),
	port: readNumber('DB_PORT', 5432),
	username: readString('DB_USERNAME', 'postgres'),
	password: readString('DB_PASSWORD', 'postgres'),
	database: readString('DB_DATABASE', 'nestjs_api'),
	applicationName: readString('APP_NAME', 'nestjs-api-template'),
	ssl: readBoolean('DB_SSL', false),
	sslRejectUnauthorized: readBoolean('DB_SSL_REJECT_UNAUTHORIZED', true),
	logging: readBoolean('DB_LOGGING', false),
	synchronize: false,
	retryAttempts: readNumber('DB_RETRY_ATTEMPTS', 10),
	retryDelay: readNumber('DB_RETRY_DELAY', 3000),
	poolSize: readNumber('DB_POOL_SIZE', 10)
}));

/**
 * JWT namespace configuration.
 */
export const jwtConfig = registerAs('jwt', (): IJwtConfig => ({
	secret: readString('JWT_SECRET', ''),
	expiresIn: readString('JWT_EXPIRES_IN', '1d')
}));
