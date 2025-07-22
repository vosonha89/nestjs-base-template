import "reflect-metadata";
import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppEnvironment } from "./core/domain/configuration/appEnvironment";
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

	const config = new DocumentBuilder()
		.setTitle(AppEnvironment.value.APP_NAME)
		.setDescription('The ' + AppEnvironment.value.APP_NAME + ' API description')
		.setVersion('1.0')
		.addTag(AppEnvironment.value.APP_NAME)
		.build();

	const documentFactory = () =>
		SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/doc', app, documentFactory);
	await app.listen(AppEnvironment.value.PORT ?? 3000);
}

function startApp(): void {
	bootstrap().then(() => {
		console.log('App started with url: http://localhost:' + AppEnvironment.value.PORT);
	}).catch((err) => {
		console.log('App error. Error: ' + err);
	});
}

startApp();
