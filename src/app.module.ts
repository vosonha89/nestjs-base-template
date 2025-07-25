import { Module } from "@nestjs/common";
import { HelloWorldModule } from './presentation/api/helloWorld/helloWorld.module';
import { ConfigModule } from "@nestjs/config";
import { ProductModule } from "./presentation/api/product/product.module";
import { APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { ResponseTransformInterceptor } from "./core/domain/helpers/responseTransformInterceptor.service";

@Module({
	imports: [
		ConfigModule.forRoot({
			// Optional: specify the path to your .env file
			envFilePath: ['env/.env'],
			// Optional: make ConfigModule global so you don't need to import it in other modules
			isGlobal: true,
			// Optional: enable variable expansion within .env files
			expandVariables: true,
		}),
		HelloWorldModule,
		ProductModule
	],
	providers: [
		Reflector,
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseTransformInterceptor,
		},
	],
})
export class AppModule {
}
