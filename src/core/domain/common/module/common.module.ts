import { Module } from "@nestjs/common";
import { LoggingService, LoggingServiceSymbol } from "../service/logging.service";
import { RequestContextService, RequestContextServiceSymbol } from "../service/requestContext.service";

@Module({
	imports: [],
	providers: [
		{
			provide: LoggingServiceSymbol,
			useClass: LoggingService
		},
		{
			provide: RequestContextServiceSymbol,
			useClass: RequestContextService
		},
	],
	exports: [
		LoggingServiceSymbol,
		RequestContextServiceSymbol
	]
})

export class CommonModule {
}
