import { Inject } from "@nestjs/common";
import { LoggingServiceSymbol } from "../service/logging.service";
import { ILoggingService } from "../service/interfaces/logging.service.interface";
import { RequestContextServiceSymbol } from "../service/requestContext.service";
import { IRequestContextService } from "../service/interfaces/requestContext.service.interface";

/**
 * The `BaseController` is an abstract class that serves as a base for all controllers in the application.
 * It provides dependency injection for common services required by derived controllers.
 *
 * This class cannot be instantiated directly and should only be extended by other controller classes.
 *
 * Dependencies:
 * - `ILoggingService`: A logging service for capturing logs throughout the controller's life cycle.
 * - `IRequestContextService`: A service to manage and provide request-specific context.
 *
 * Properties are injected automatically at runtime using dependency injection.
 */
export abstract class BaseController {
	protected constructor(
		@Inject(LoggingServiceSymbol) public readonly loggingService: ILoggingService,
		@Inject(RequestContextServiceSymbol) public readonly context: IRequestContextService,
	) {
	}
}
