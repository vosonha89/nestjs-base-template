import { Module } from "@nestjs/common";
import { HelloWorldModule } from './presentation/api/helloWorld/helloWorld.module';
import { ConfigModule } from "@nestjs/config";
import { ProductModule } from "./presentation/api/product/product.module";
import { APP_INTERCEPTOR, APP_GUARD, Reflector } from "@nestjs/core";
import { ResponseTransformInterceptor } from "./core/domain/helpers/responseTransformInterceptor.service";
import { UserModule } from "./presentation/api/user/user.module";
import { AuthModule } from "./presentation/api/auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "./core/application/guards/auth.guard";

@Module({
	imports: [
		ConfigModule.forRoot({
			// Optional: specify the path to your .env file
			envFilePath: [`env/.env.${process.env.NODE_ENV || 'development'}`],
			// Optional: make ConfigModule global so you don't need to import it in other modules
			isGlobal: true,
			// Optional: enable variable expansion within .env files
			expandVariables: true,
		}),
		JwtModule.register({
			global: true,
			secret: process.env.JWT_SECRET ?? 'defaultSecretKey',
			signOptions: { expiresIn: '1d' },
		}),
		HelloWorldModule,
		ProductModule,
		UserModule,
		AuthModule,
	],
	providers: [
		Reflector,
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseTransformInterceptor,
		},
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
	],
})
export class AppModule {
}
