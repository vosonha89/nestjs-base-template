import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppError, ClientError } from './client-error';
import {
	ErrorResponse,
	fromAppError,
	InternalServerError,
	NotFound,
	TooManyRequests,
	Unauthorized,
	Forbidden,
	Conflict,
	BadRequest
} from './error-response';
import { GlobalError } from './global-error';
import { LoggingServiceSymbol } from '../service/logging.service';
import { ILoggingService } from '../service/logging.service.interface';
import { RequestWithUser } from '../type/request-with-user.type';

/**
 * Single exit point for every error raised inside the application.
 *
 * Converts `AppError`, Nest `HttpException`, TypeORM driver errors and plain
 * `Error` instances into the standard {@link ErrorResponse} envelope, and sets
 * the matching HTTP status so monitoring and clients can rely on the
 * transport layer instead of parsing the body.
 */
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
	/**
	 * Constructor
	 * @param loggingService - Structured logger
	 */
	public constructor(@Inject(LoggingServiceSymbol) private readonly loggingService: ILoggingService) {}

	/**
	 * Handles an uncaught exception.
	 * @param exception - Whatever was thrown
	 * @param host - Nest execution context
	 */
	public catch(exception: unknown, host: ArgumentsHost): void {
		const http = host.switchToHttp();
		const response = http.getResponse<Response>();
		const request = http.getRequest<RequestWithUser>();

		const envelope = this.toEnvelope(exception);
		this.writeLog(exception, request, envelope);

		response.status(envelope.status).json(envelope);
	}

	/**
	 * Maps any thrown value onto the response envelope.
	 * @param exception - Whatever was thrown
	 * @returns The envelope to serialise
	 */
	private toEnvelope(exception: unknown): ErrorResponse {
		if (exception instanceof AppError) {
			return fromAppError(exception);
		}

		if (exception instanceof HttpException) {
			return this.fromHttpException(exception);
		}

		if (exception instanceof QueryFailedError) {
			return this.fromQueryError(exception);
		}

		return InternalServerError();
	}

	/**
	 * Maps a Nest `HttpException` (throttler, passport, manual `throw`) onto the envelope.
	 * @param exception - The HTTP exception
	 * @returns The envelope to serialise
	 */
	private fromHttpException(exception: HttpException): ErrorResponse {
		const status = exception.getStatus() as HttpStatus;

		switch (status) {
			case HttpStatus.UNAUTHORIZED:
				return Unauthorized(exception.message);
			case HttpStatus.FORBIDDEN:
				return Forbidden(exception.message);
			case HttpStatus.NOT_FOUND:
				return NotFound(exception.message);
			case HttpStatus.TOO_MANY_REQUESTS:
				return TooManyRequests();
			case HttpStatus.CONFLICT:
				return Conflict();
			case HttpStatus.BAD_REQUEST:
				return BadRequest(this.extractClientError(exception));
			default:
				return InternalServerError();
		}
	}

	/**
	 * Extracts a {@link ClientError} from a Nest exception response, when present.
	 * @param exception - The HTTP exception
	 * @returns The client error, or `undefined`
	 */
	private extractClientError(exception: HttpException): ClientError | undefined {
		const payload = exception.getResponse();

		if (typeof payload === 'object' && payload !== null && 'exception' in payload) {
			const candidate = (payload as { exception?: unknown }).exception;

			if (candidate instanceof ClientError) {
				return candidate;
			}
		}

		return undefined;
	}

	/**
	 * Maps a TypeORM driver error onto the envelope.
	 *
	 * Unique violations become `409` instead of leaking a raw SQL error, and
	 * every other driver failure becomes an opaque `500`.
	 * @param exception - The driver error
	 * @returns The envelope to serialise
	 */
	private fromQueryError(exception: Error): ErrorResponse {
		const driverCode = (exception as { driverError?: { code?: string } }).driverError?.code;

		if (driverCode === '23505') {
			return Conflict();
		}

		if (driverCode === '23503') {
			return Conflict(
				new ClientError(
					String(GlobalError.ConflictError.code),
					'Related record is missing or still referenced.'
				)
			);
		}

		return InternalServerError();
	}

	/**
	 * Writes a structured log line, keeping stack traces out of 4xx noise.
	 * @param exception - Whatever was thrown
	 * @param request - Incoming request, used for the correlation id
	 * @param envelope - Envelope that was returned to the caller
	 */
	private writeLog(exception: unknown, request: RequestWithUser, envelope: ErrorResponse): void {
		const meta: Record<string, unknown> = {
			requestId: request.requestId,
			method: request.method,
			url: request.originalUrl,
			status: envelope.status
		};

		const message = envelope.exception?.errorMessage ?? envelope.msg;
		const status = envelope.status as HttpStatus;

		if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
			this.loggingService.error(
				message,
				exception instanceof Error ? exception : undefined,
				'AllExceptionFilter',
				meta
			);
			return;
		}

		this.loggingService.warn(message, 'AllExceptionFilter', meta);
	}
}
