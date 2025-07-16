import { Request } from "express";

/**
 * Interface for logging operations
 */
export interface ILoggingService {
	/**
	 * Logs information messages
	 * @param message The message to log
	 * @param context Optional context for the log
	 * @param meta Optional metadata to include with the log
	 */
	info(message: string, context?: string, meta?: Record<string, unknown>): void;

	/**
	 * Logs error messages
	 * @param message The error message to log
	 * @param error Optional error object
	 * @param context Optional context for the log
	 * @param meta Optional metadata to include with the log
	 */
	error(message: string, error?: Error, context?: string, meta?: Record<string, unknown>): void;

	/**
	 * Converts a Request object into its string representation.
	 *
	 * @param {Request} req - The Request object to be converted into a string.
	 * @return {string} A string representation of the Request object.
	 */
	requestToString(req: Request): string;
}
