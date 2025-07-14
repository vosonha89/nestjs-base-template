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
}
