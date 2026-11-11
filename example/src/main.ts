import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';
import { SWAGGER_TAGS } from './presentation/feature.registry';

/**
 * Boots the HTTP application.
 *
 * Transport concerns (helmet, CORS, global prefix, URI versioning, shutdown
 * hooks) live in {@link configureApplication} so the e2e suite exercises the
 * same configuration. This function only adds Swagger and starts listening.
 */
async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });
	const logger = app.get(Logger);

	app.useLogger(logger);

	const config = configureApplication(app);

	if (config.swaggerEnabled) {
		const builder = new DocumentBuilder()
			.setTitle(config.name)
			.setDescription(`${config.name} API`)
			.setVersion(config.version)
			.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' });

		// Tags come from the feature registry, so a new feature never requires
		// editing this file — which is what keeps it identical across template
		// and example.
		for (const tag of SWAGGER_TAGS) {
			builder.addTag(tag);
		}

		const document = SwaggerModule.createDocument(app, builder.build());

		SwaggerModule.setup(config.swaggerPath, app, document, {
			swaggerOptions: { persistAuthorization: true, docExpansion: 'list' }
		});
	}

	await app.listen(config.port);

	logger.log(
		`API ready on http://localhost:${config.port}/${config.apiPrefix}/v${config.apiDefaultVersion}` +
			(config.swaggerEnabled ? ` (docs: /${config.swaggerPath})` : '')
	);
}

bootstrap().catch((error: unknown) => {
	// The Nest logger is not available this early, so a plain write is used —
	// but the exit code matters: a failed boot must not look like a success.
	process.stderr.write(`Failed to start the application: ${String(error)}\n`);
	process.exit(1);
});
