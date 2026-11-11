import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppEnvironment } from './app-environment.enum';
import { appConfig, dbConfig, jwtConfig } from './configuration';
import { validateEnvironment } from './env.validation';

/**
 * Resolves the env files to load, in priority order.
 *
 * The active environment comes from the process environment (set by the shell,
 * the container runtime or the test runner), never from the env file itself, so
 * there is no bootstrapping cycle.
 *
 * `@nestjs/config` uses the first file that exists, which gives a useful
 * fallback for `NODE_ENV=test` (Jest sets it): if `env/.env.test` is absent the
 * development file is used, so a fresh clone can run the e2e suite without
 * creating another file.
 * @returns Ordered candidate paths, most specific first
 */
function resolveEnvFilePaths(): string[] {
	const environment = process.env.NODE_ENV ?? AppEnvironment.DEVELOPMENT;

	return [`env/.env.${environment}`, `env/.env.${AppEnvironment.DEVELOPMENT}`];
}

/**
 * Loads, validates and namespaces every environment variable.
 *
 * Registered as global so no feature module has to import it.
 */
@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			expandVariables: true,
			envFilePath: resolveEnvFilePaths(),
			validate: validateEnvironment,
			load: [appConfig, dbConfig, jwtConfig]
		})
	]
})
export class AppConfigModule {}
