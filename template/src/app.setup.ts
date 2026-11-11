import { INestApplication, RequestMethod, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { IAppConfig } from '@config/config.type';

/**
 * Applies every transport level setting the application relies on.
 *
 * Extracted from `main.ts` so the e2e suite can boot the exact same stack —
 * global prefix, URI versioning, CORS, helmet and shutdown hooks — instead of
 * re-implementing it and drifting out of sync.
 * @param app - Nest application instance
 * @returns The resolved application configuration
 */
export function configureApplication(app: INestApplication): IAppConfig {
	const config = app.get(ConfigService).getOrThrow<IAppConfig>('app');

	app.use(helmet());
	app.enableCors({
		origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
	});

	app.setGlobalPrefix(config.apiPrefix, {
		exclude: [{ path: 'health', method: RequestMethod.GET }]
	});

	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: config.apiDefaultVersion
	});

	// Required for `onModuleDestroy` / `onApplicationShutdown` to run on SIGTERM.
	app.enableShutdownHooks();

	return config;
}
