import { plainToInstance } from 'class-transformer';
import {
	IsEnum,
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	Max,
	Min,
	MinLength,
	validateSync
} from 'class-validator';
import { AppEnvironment } from './app-environment.enum';

/**
 * Declarative schema for every environment variable the application needs.
 *
 * Validation runs once at boot (see {@link validateEnvironment}). When a value
 * is missing or malformed the process exits immediately with a readable
 * report instead of failing later at the first request.
 */
export class EnvironmentVariables {
	/** Active runtime environment. */
	@IsOptional()
	@IsEnum(AppEnvironment)
	public NODE_ENV?: AppEnvironment;

	/** Application name used in Swagger and logs. */
	@IsString()
	@IsNotEmpty()
	public APP_NAME!: string;

	/** TCP port the server binds to. */
	@IsInt()
	@Min(1)
	@Max(65535)
	public APP_PORT!: number;

	/** Application version string. */
	@IsString()
	@IsNotEmpty()
	public APP_VERSION!: string;

	/** Global route prefix. */
	@IsString()
	@IsNotEmpty()
	public API_PREFIX!: string;

	/** Default URI version for controllers. */
	@IsString()
	@IsNotEmpty()
	public API_DEFAULT_VERSION!: string;

	/** `true` exposes the Swagger UI. */
	@IsIn(['true', 'false'])
	public SWAGGER_ENABLED!: string;

	/** Path the Swagger UI is mounted on. */
	@IsString()
	@IsNotEmpty()
	public SWAGGER_PATH!: string;

	/** Database host. */
	@IsString()
	@IsNotEmpty()
	public DB_HOST!: string;

	/** Database port. */
	@IsInt()
	@Min(1)
	@Max(65535)
	public DB_PORT!: number;

	/** Database user. */
	@IsString()
	@IsNotEmpty()
	public DB_USERNAME!: string;

	/** Database password. */
	@IsString()
	public DB_PASSWORD!: string;

	/** Database name. */
	@IsString()
	@IsNotEmpty()
	public DB_DATABASE!: string;

	/** `true` enables TLS for the database connection. */
	@IsIn(['true', 'false'])
	public DB_SSL!: string;

	/** `true` validates the server certificate chain. */
	@IsOptional()
	@IsIn(['true', 'false'])
	public DB_SSL_REJECT_UNAUTHORIZED?: string;

	/** `true` logs executed SQL statements. */
	@IsOptional()
	@IsIn(['true', 'false'])
	public DB_LOGGING?: string;

	/** JWT signing secret. */
	@IsString()
	@MinLength(32, {
		message:
			"JWT_SECRET must be at least 32 characters long. Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
	})
	public JWT_SECRET!: string;

	/** JWT lifetime, e.g. `1d`. Must be `ms`-compatible. */
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d+(ms|s|m|h|d|w|y)?$/, {
		message: 'JWT_EXPIRES_IN must be a duration such as 30m, 12h, 1d or 7d'
	})
	public JWT_EXPIRES_IN!: string;

	/** Comma separated list of allowed CORS origins. */
	@IsString()
	public CORS_ORIGINS!: string;
}

/**
 * Validates the raw environment before the application bootstraps.
 * @param config - Raw key/value map produced by `@nestjs/config`
 * @returns The same map, with primitives converted by `class-transformer`
 * @throws Error listing every invalid variable so the operator can fix them all at once
 */
export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
	const validated = plainToInstance(EnvironmentVariables, config, {
		enableImplicitConversion: true,
		exposeDefaultValues: false
	});

	const errors = validateSync(validated, {
		skipMissingProperties: false,
		stopAtFirstError: false
	});

	if (errors.length > 0) {
		const details = errors
			.map((error) => {
				const messages = Object.values(error.constraints ?? {}).join(' | ');
				return `  - ${error.property}: ${messages}`;
			})
			.join('\n');

		throw new Error(`Invalid environment configuration:\n${details}`);
	}

	return { ...config };
}
