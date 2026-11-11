import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ILoggingService } from './logging.service.interface';

/**
 * Service symbol for DI register
 */
export const LoggingServiceSymbol = Symbol('LoggingService');

/**
 * Pino backed implementation of {@link ILoggingService}.
 *
 * Emits one JSON object per line, which is what log aggregators expect, and
 * relies on the redaction rules configured in `CommonModule` so credentials
 * never reach the log sink.
 *
 * `PinoLogger` is injected rather than the Nest style `Logger` wrapper: only the
 * former accepts `(fields, message)`, which is required to attach the
 * correlation id and other structured fields. The context travels inside the
 * fields object instead of through `setContext()`, so concurrent requests cannot
 * overwrite each other's value.
 */
@Injectable()
export class LoggingService implements ILoggingService {
	/**
	 * Constructor
	 * @param logger - Pino logger provided by `nestjs-pino`
	 */
	public constructor(private readonly logger: PinoLogger) {}

	/**
	 * Logs a diagnostic message.
	 * @param message - Message to log
	 * @param context - Logical source, usually the class name
	 * @param meta - Additional structured fields
	 */
	public debug(message: string, context?: string, meta?: Record<string, unknown>): void {
		this.logger.debug({ context, ...meta }, message);
	}

	/**
	 * Logs a normal operation message.
	 * @param message - Message to log
	 * @param context - Logical source, usually the class name
	 * @param meta - Additional structured fields
	 */
	public info(message: string, context?: string, meta?: Record<string, unknown>): void {
		this.logger.info({ context, ...meta }, message);
	}

	/**
	 * Logs a recoverable problem.
	 * @param message - Message to log
	 * @param context - Logical source, usually the class name
	 * @param meta - Additional structured fields
	 */
	public warn(message: string, context?: string, meta?: Record<string, unknown>): void {
		this.logger.warn({ context, ...meta }, message);
	}

	/**
	 * Logs a failure.
	 * @param message - Message to log
	 * @param error - Error instance, its stack is serialised
	 * @param context - Logical source, usually the class name
	 * @param meta - Additional structured fields
	 */
	public error(message: string, error?: Error, context?: string, meta?: Record<string, unknown>): void {
		this.logger.error({ context, err: error, ...meta }, message);
	}
}
