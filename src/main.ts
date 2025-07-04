import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

function startApp(): void {
  bootstrap().then(() => {
    console.log('App started');
  }).catch((err) => {
    console.log('App error. Error: ' + err);
  });
}

startApp();