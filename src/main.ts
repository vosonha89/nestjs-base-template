import "reflect-metadata";
import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { ResponseTransformInterceptor } from "./core/domain/helpers/responseTransformInterceptor.service";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Configure global UndefinedToNullInterceptor
	app.useGlobalInterceptors(new ResponseTransformInterceptor(app.get(Reflector)));

	// Configure global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);

	const configService = app.get(ConfigService);
	const appName = configService.get<string>('APP_NAME') ?? 'nestjs-base-template';
	const port = configService.get<number>('PORT') ?? 3000;

	const config = new DocumentBuilder()
		.setTitle(appName)
		.setDescription('The ' + appName + ' API description')
		.setVersion('1.0')
		.addTag(appName)
		.build();

	const documentFactory = () =>
		SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/doc', app, documentFactory);
	await app.listen(port);
	console.log('App started with url: http://localhost:' + port);
}

function startApp(): void {
	bootstrap().catch((err) => {
		console.log('App error. Error: ' + err);
	});
}

startApp();
