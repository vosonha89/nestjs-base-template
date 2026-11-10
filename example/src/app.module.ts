import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppConfigModule } from '@config/app-config.module';
import { CommonModule } from '@common/common.module';
import { CorrelationIdMiddleware } from '@common/middleware/correlation-id.middleware';
import { DataModule } from '@data/database.module';
import { PresentationModule } from '@presentation/presentation.module';

/**
 * Composes the whole application.
 *
 * The module list mirrors the layer diagram: configuration, cross-cutting
 * concerns (logging, guards, interceptors, filters), data access, then the HTTP
 * surface. Nothing else belongs here.
 */
@Module({
	imports: [AppConfigModule, CommonModule, DataModule, PresentationModule]
})
export class AppModule implements NestModule {
	/**
	 * Applies the correlation id middleware to every route.
	 *
	 * `path-to-regexp` v8 (bundled with Nest 12) only understands named
	 * wildcards, hence `{*path}`. The global prefix wraps middleware paths, so
	 * `/health` — which is excluded from the prefix — is listed separately.
	 * @param consumer - Nest middleware consumer
	 */
	public configure(consumer: MiddlewareConsumer): void {
		consumer
			.apply(CorrelationIdMiddleware)
			.forRoutes({ path: '{*path}', method: RequestMethod.ALL }, { path: 'health', method: RequestMethod.ALL });
	}
}
