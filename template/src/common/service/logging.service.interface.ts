/**
 * Structured logging contract.
 *
 * Kept behind an interface so the implementation (currently pino) can be
 * swapped without touching business code, and so tests can pass a stub.
 */
export interface ILoggingService {
	/**
	 * Logs a diagnostic message, suppressed above `debug` level.
	 * @param message - Message to log
	 * @param context - Logical source, usually the class name
	 * @param meta - Additional structured fields
	 */
	debug(message: string, context?: string, meta?: Record<string, unknown>): void;

	/**
	 * Logs a normal operation message.
	 * @param message - Message to log
	 * @param context - Logical source, usually the class name
	 * @param meta - Additional structured fields
	 */
	info(message: string, context?: string, meta?: Record<string, unknown>): void;

	/**
	 * Logs a recoverable problem.
	 * @param message - Message to log
	 * @param context - Logical source, usually the class name
	 * @param meta - Additional structured fields
	 */
	warn(message: string, context?: string, meta?: Record<string, unknown>): void;

	/**
	 * Logs a failure, including the stack trace when available.
	 * @param message - Message to log
	 * @param error - Error instance, its stack is serialised
	 * @param context - Logical source, usually the class name
	 * @param meta - Additional structured fields
	 */
	error(message: string, error?: Error, context?: string, meta?: Record<string, unknown>): void;
}
