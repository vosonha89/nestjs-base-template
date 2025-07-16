import { Module } from "@nestjs/common";
import { HelloWorldController } from "./helloWorld.controller";
import {
	HelloWorldService,
	HelloWorldServiceSymbol
} from "../../../core/application/services/helloWorld/helloWorld.service";
import { CommonModule } from "../../../core/domain/common/module/common.module";

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

export class HelloWorldModule {
}
