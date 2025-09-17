import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { HelloWorldController } from "./helloWorld.controller";
import {
	HelloWorldService,
	HelloWorldServiceSymbol
} from "../../../core/application/services/helloWorld/helloWorld.service";
import { CommonModule } from "../../../core/domain/common/module/common.module";
import { CaptureRequestMiddleware } from "../../../core/application/middlewares/captureRequest.middleware";

@Module({
	imports: [
		CommonModule
	],
	controllers: [
		HelloWorldController
	],
	providers: [

		{
			provide: HelloWorldServiceSymbol,
			useClass: HelloWorldService
		}
	],
})

export class HelloWorldModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(CaptureRequestMiddleware)
			.forRoutes(HelloWorldController); // or { path: 'users', method: RequestMethod.ALL }
	}
}
