import {Injectable} from '@nestjs/common';
import {ILoggingService} from './interfaces/logging.service.interface';

/**
 * Service symbol for DI register
 */
export const LoggingServiceSymbol = Symbol("LoggingService");

/**
 * Service for handling application logging
 * Provides methods to log information and errors using the console
 */
@Injectable()
export class LoggingService implements ILoggingService {
    /**
     * Logs information messages
     * @param message The message to log
     * @param context Optional context for the log
     * @param meta Optional metadata to include with the log
     */
    public info(message: string, context?: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        const contextInfo = context ? `[${context}]` : '';
        const metaInfo = meta ? JSON.stringify(meta) : '';

        console.log(`${timestamp} INFO ${contextInfo} ${message} ${metaInfo}`.trim());
    }

    /**
     * Logs error messages
     * @param message The error message to log
     * @param error Optional error object
     * @param context Optional context for the log
     * @param meta Optional metadata to include with the log
     */
    public error(message: string, error?: Error, context?: string, meta?: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        const contextInfo = context ? `[${context}]` : '';
        const metaInfo = meta ? JSON.stringify(meta) : '';
        const errorStack = error?.stack ? `\n${error.stack}` : '';

        console.error(`${timestamp} ERROR ${contextInfo} ${message} ${metaInfo} ${errorStack}`.trim());
    }
}
