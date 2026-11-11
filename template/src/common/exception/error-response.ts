import { HttpStatus } from '@nestjs/common';
import { BaseResponseData } from '../base/base.response';
import { AppError, ClientError, ErrorMessage } from './client-error';
import { GlobalError } from './global-error';

/**
 * Converts a catalogue entry into the payload exposed to clients.
 * @param source - Catalogue entry
 * @returns A `ClientError` carrying the numeric code as a string
 */
function toClientError(source: ErrorMessage): ClientError {
	return new ClientError(String(source.code), source.msg);
}

/**
 * Failure envelope. Mirrors {@link BaseResponseData} but never carries `data`.
 */
export class ErrorResponse extends BaseResponseData<unknown> {
	/**
	 * Constructor
	 * @param status - HTTP status code
	 * @param msg - Human readable summary
	 * @param exception - Client facing error payload
	 */
	public constructor(status: number, msg?: string, exception?: ClientError) {
		super();
		this.data = undefined;
		this.status = status;
		this.successful = false;

		if (msg !== undefined && msg !== '') {
			this.msg = msg;
		}

		if (exception) {
			this.exception = exception;
		}
	}
}

/**
 * `404 Not Found`
 * @param message - Optional override of the default message
 * @returns The failure envelope
 */
export const NotFound = (message = 'The requested resource could not be found.'): ErrorResponse =>
	new ErrorResponse(HttpStatus.NOT_FOUND, message, toClientError(GlobalError.NotFoundError));

/**
 * `401 Unauthorized`
 * @param message - Optional override of the default message
 * @returns The failure envelope
 */
export const Unauthorized = (message = 'The user does not have the necessary credentials.'): ErrorResponse =>
	new ErrorResponse(HttpStatus.UNAUTHORIZED, message, toClientError(GlobalError.UnauthorizedError));

/**
 * `403 Forbidden`
 * @param message - Optional override of the default message
 * @returns The failure envelope
 */
export const Forbidden = (message = 'The user is not allowed to perform this operation.'): ErrorResponse =>
	new ErrorResponse(HttpStatus.FORBIDDEN, message, toClientError(GlobalError.ForbiddenError));

/**
 * `409 Conflict`
 * @param exception - Optional override of the error payload
 * @returns The failure envelope
 */
export const Conflict = (exception?: ClientError): ErrorResponse =>
	new ErrorResponse(
		HttpStatus.CONFLICT,
		'The request conflicts with the current state of the resource.',
		exception ?? toClientError(GlobalError.ConflictError)
	);

/**
 * `429 Too Many Requests`
 * @returns The failure envelope
 */
export const TooManyRequests = (): ErrorResponse =>
	new ErrorResponse(
		HttpStatus.TOO_MANY_REQUESTS,
		'Too many requests, please slow down.',
		toClientError(GlobalError.TooManyRequestsError)
	);

/**
 * `400 Bad Request`
 * @param exception - Optional client facing error payload
 * @returns The failure envelope
 */
export const BadRequest = (exception?: ClientError): ErrorResponse =>
	new ErrorResponse(
		HttpStatus.BAD_REQUEST,
		'The server cannot or will not process the request due to an apparent client error.',
		exception ?? toClientError(GlobalError.BadRequestError)
	);

/**
 * `500 Internal Server Error`
 * @param exception - Optional client facing error payload
 * @returns The failure envelope
 */
export const InternalServerError = (exception?: ClientError): ErrorResponse =>
	new ErrorResponse(
		HttpStatus.INTERNAL_SERVER_ERROR,
		'An unexpected condition was encountered and no more specific message is suitable.',
		exception ?? toClientError(GlobalError.InternalServerError)
	);

/**
 * Renders any {@link AppError} into the failure envelope.
 * @param error - Error raised by the application
 * @returns The failure envelope
 */
export const fromAppError = (error: AppError): ErrorResponse =>
	new ErrorResponse(error.httpStatus, error.exception.errorMessage, error.exception);
