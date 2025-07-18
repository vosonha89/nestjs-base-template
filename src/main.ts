import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppEnvironment } from "./core/domain/configuration/environment";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
        .setTitle(AppEnvironment.APP_NAME)
        .setDescription('The ' + AppEnvironment.APP_NAME + ' API description')
        .setVersion('1.0')
        .addTag(AppEnvironment.APP_NAME)
        .build();

    const documentFactory = () =>
		SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/doc', app, documentFactory);
    await app.listen(AppEnvironment.PORT ?? 3000);
}

function startApp(): void {
    bootstrap().then(() => {
        console.log('App started with url: http://localhost:' + AppEnvironment.PORT);
    }).catch((err) => {
        console.log('App error. Error: ' + err);
    });
}

startApp();
