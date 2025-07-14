import "reflect-metadata";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {AppEnvironment} from "./core/domain/configuration/environment";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
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