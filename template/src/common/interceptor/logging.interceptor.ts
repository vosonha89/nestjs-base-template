import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingServiceSymbol } from '../service/logging.service';
import { ILoggingService } from '../service/logging.service.interface';
import { RequestWithUser } from '../type/request-with-user.type';

/**
 * Emits one structured access log line per request.
 *
 * Only method, URL, status and duration are recorded — never headers, query
 * strings or bodies, so credentials cannot end up in the log sink (the
 * original `CaptureRequestMiddleware` logged all three).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	/**
	 * Constructor
	 * @param loggingService - Structured logger
	 */
	public constructor(@Inject(LoggingServiceSymbol) private readonly loggingService: ILoggingService) {}

	/**
	 * Times the request and logs the outcome.
	 * @param context - Nest execution context
	 * @param next - Remaining handler chain
	 * @returns The untouched stream
	 */
	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const http = context.switchToHttp();
		const request = http.getRequest<RequestWithUser>();
		const startedAt = Date.now();

		return next.handle().pipe(
			tap({
				next: () => this.write(request, startedAt, 'completed'),
				error: (error: unknown) =>
					this.write(request, startedAt, error instanceof Error ? error.name : 'failed')
			})
		);
	}

	/**
	 * Writes the access log entry.
	 * @param request - Incoming request
	 * @param startedAt - Timestamp captured before the handler ran
	 * @param outcome - Short label describing the result
	 */
	private write(request: RequestWithUser, startedAt: number, outcome: string): void {
		const durationMs = Date.now() - startedAt;

		this.loggingService.info(
			`${request.method} ${request.originalUrl} -> ${outcome} in ${durationMs}ms`,
			'LoggingInterceptor',
			{ requestId: request.requestId, durationMs }
		);
	}
}
