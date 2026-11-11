import { HttpStatus } from '@nestjs/common';

/**
 * Numeric error catalogue entry produced by {@link GlobalError}.
 *
 * These numbers are part of the public API contract (4001 = required field
 * missing, 4002 = wrong type, …) and must stay stable.
 */
export interface ErrorMessage {
	/** Numeric business code, e.g. `4001`. */
	readonly code: number;

	/** Human readable description, safe to show to an end user. */
	readonly msg: string;
}

/**
 * Error payload embedded in every failed response under `exception`.
 */
export class ClientError {
	/**
	 * Stable machine readable identifier.
	 * Either an HTTP status (`404`) or a fine grained validation code (`4001`),
	 * both taken verbatim from {@link GlobalError}.
	 */
	public errorCode: string;

	/** Human readable description. */
	public errorMessage: string;

	/**
	 * Constructor
	 * @param errorCode - Stable machine readable identifier
	 * @param errorMessage - Human readable description
	 */
	public constructor(errorCode: string, errorMessage: string) {
		this.errorCode = errorCode;
		this.errorMessage = errorMessage;
	}
}

/**
 * Base class for every error the application raises on purpose.
 *
 * Carries the HTTP status and the client facing payload so
 * `AllExceptionFilter` can render a consistent envelope without guessing.
 */
export class AppError extends Error {
	/** HTTP status the filter must emit. */
	public readonly httpStatus: HttpStatus;

	/** Payload returned to the caller. */
	public readonly exception: ClientError;

	/**
	 * Constructor
	 * @param httpStatus - HTTP status to emit
	 * @param exception - Client facing payload
	 * @param message - Optional internal message, defaults to `exception.errorMessage`
	 */
	public constructor(httpStatus: HttpStatus, exception: ClientError, message?: string) {
		super(message ?? exception.errorMessage);
		this.name = 'AppError';
		this.httpStatus = httpStatus;
		this.exception = exception;
	}
}

/**
 * Raised by `AppValidationPipe` when a request payload is rejected.
 * Always maps to HTTP 400.
 */
export class ValidationAppError extends AppError {
	/**
	 * Constructor
	 * @param exception - Client facing payload describing the first failure
	 */
	public constructor(exception: ClientError) {
		super(HttpStatus.BAD_REQUEST, exception, exception.errorMessage);
		this.name = 'ValidationAppError';
	}
}
