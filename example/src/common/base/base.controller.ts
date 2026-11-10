import { Inject } from '@nestjs/common';
import { LoggingServiceSymbol } from '../service/logging.service';
import { ILoggingService } from '../service/logging.service.interface';
import { RequestContextServiceSymbol } from '../service/request-context.service';
import { IRequestContextService } from '../service/request-context.service.interface';

/**
 * Base class for every HTTP controller.
 *
 * Exposes the two collaborators that controllers legitimately need — logging
 * and request context — so the HTTP layer stays free of business logic while
 * still being observable.
 */
export abstract class BaseController {
	/**
	 * Constructor
	 * @param loggingService - Structured logger
	 * @param context - Request scoped data
	 */
	protected constructor(
		@Inject(LoggingServiceSymbol) public readonly loggingService: ILoggingService,
		@Inject(RequestContextServiceSymbol) public readonly context: IRequestContextService
	) {}
}
