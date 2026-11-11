import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ConstantValue } from '../constant/constant-value';
import { RequestContextServiceSymbol } from '../service/request-context.service';
import { IRequestContextService } from '../service/request-context.service.interface';
import { RequestWithUser } from '../type/request-with-user.type';

/**
 * Assigns a correlation id to every request and opens the async context.
 *
 * The id is echoed back in the `x-request-id` header and reused by the logger,
 * which makes a single request traceable across log lines. An inbound id is
 * accepted only when it matches a strict pattern, so a caller cannot inject
 * arbitrary characters into log output.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	/** Pattern an inbound correlation id must satisfy. */
	private static readonly VALID_ID = /^[A-Za-z0-9._-]{1,128}$/;

	/**
	 * Constructor
	 * @param contextService - Service that owns the async context storage
	 */
	public constructor(@Inject(RequestContextServiceSymbol) private readonly contextService: IRequestContextService) {}

	/**
	 * Binds the request to the async context and stores the correlation id.
	 * @param request - Incoming request
	 * @param response - Outgoing response
	 * @param next - Express continuation
	 */
	public use(request: RequestWithUser, response: Response, next: NextFunction): void {
		const requestId = this.resolveRequestId(request);

		request.requestId = requestId;
		response.setHeader(ConstantValue.REQUEST_ID_HEADER, requestId);

		this.contextService.run(request, () => next());
	}

	/**
	 * Reuses a well formed inbound id, otherwise generates a new one.
	 * @param request - Incoming request
	 * @returns The correlation id to use
	 */
	private resolveRequestId(request: RequestWithUser): string {
		const header = request.headers[ConstantValue.REQUEST_ID_HEADER];
		const candidate = Array.isArray(header) ? header[0] : header;

		if (typeof candidate === 'string' && CorrelationIdMiddleware.VALID_ID.test(candidate)) {
			return candidate;
		}

		return randomUUID();
	}
}
