import { Inject } from '@nestjs/common';
import { RequestContextServiceSymbol } from '../service/request-context.service';
import { IRequestContextService } from '../service/request-context.service.interface';

/**
 * Base class for business services that need access to request scoped data
 * (correlation id, authenticated principal, language).
 *
 * The context is a singleton backed by `AsyncLocalStorage`, so extending this
 * class does not force the request scope onto the DI graph.
 */
export abstract class BaseService {
	/** Request scoped data, see {@link IRequestContextService}. */
	protected readonly context: IRequestContextService;

	/**
	 * Constructor
	 * @param requestContextService - Service exposing the current request
	 */
	protected constructor(@Inject(RequestContextServiceSymbol) requestContextService: IRequestContextService) {
		this.context = requestContextService;
	}
}
