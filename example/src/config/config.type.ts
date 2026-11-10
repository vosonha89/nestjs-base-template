import { AppEnvironment } from './app-environment.enum';

/**
 * Application level configuration resolved from the environment.
 */
export interface IAppConfig {
	/** Active runtime environment. */
	readonly env: AppEnvironment;

	/** Human readable application name, used by Swagger and logs. */
	readonly name: string;

	/** TCP port the HTTP server listens on. */
	readonly port: number;

	/** Semantic version reported by Swagger and the health endpoint. */
	readonly version: string;

	/** Global route prefix, e.g. `api`. */
	readonly apiPrefix: string;

	/** Default URI version applied to every controller, e.g. `1`. */
	readonly apiDefaultVersion: string;

	/** Whether the OpenAPI document and Swagger UI are exposed. */
	readonly swaggerEnabled: boolean;

	/** Path the Swagger UI is mounted on, e.g. `api/doc`. */
	readonly swaggerPath: string;

	/** Allowed CORS origins. `['*']` allows every origin. */
	readonly corsOrigins: string[];

	/** Rate limit window in seconds. */
	readonly throttleTtl: number;

	/** Maximum number of requests per window per client. */
	readonly throttleLimit: number;
}

/**
 * Database connection configuration.
 */
export interface IDbConfig {
	/** Database host. */
	readonly host: string;

	/** Database port. */
	readonly port: number;

	/** Database user. */
	readonly username: string;

	/** Database password. */
	readonly password: string;

	/** Database name. */
	readonly database: string;

	/** Whether the connection is encrypted with TLS. */
	readonly ssl: boolean;

	/**
	 * When `true`, the server certificate chain is validated against the CA store.
	 * Some managed providers ship certificates that require this to be disabled;
	 * keep it `true` whenever possible.
	 */
	readonly sslRejectUnauthorized: boolean;

	/** Whether TypeORM logs executed SQL. Keep `false` outside local debugging. */
	readonly logging: boolean;

	/**
	 * Always `false`. Schema changes go through migrations only — enabling
	 * synchronisation can silently drop production data.
	 */
	readonly synchronize: boolean;

	/** Number of connection attempts before the application gives up. */
	readonly retryAttempts: number;

	/** Delay between connection attempts, in milliseconds. */
	readonly retryDelay: number;

	/** Maximum size of the connection pool. */
	readonly poolSize: number;
}

/**
 * JWT signing configuration.
 */
export interface IJwtConfig {
	/** HS256 signing secret. Minimum 32 characters, validated at boot. */
	readonly secret: string;

	/** Token lifetime, e.g. `1d`, `12h`, `30m`. */
	readonly expiresIn: string;
}
