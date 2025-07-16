import { HttpStatus } from '@nestjs/common';
import { ClientError } from '../common/base/base.exceptions';
import { BaseResponseData } from '../common/base/base.response';
import { AnyType } from '../common/base/base.type';
import { GlobalError } from './globalError.type';
import { ExceptionCode } from "../common/constant/exceptionCode";

/**
 * Creates a new ErrorResponse instance
 * @param {number} status - The HTTP status code of the error
 * @param {string} [msg] - Optional message describing the error
 * @param {ClientError} [exception] - Optional client error object containing additional error details
 */
export class ErrorResponse extends BaseResponseData<AnyType> {
	constructor(status: number, msg?: string, exception?: ClientError) {
		super();
		this.data = undefined;
		this.status = status;
		this.successful = false;
		if (msg) {
			this.msg = msg;
		}
		if (exception) {
			if (!exception.errorCode) {
				exception.errorCode = ExceptionCode.UNEXPECTED;
			}
			this.exception = {
				errorCode: exception.errorCode,
				errorMessage: exception.errorMessage,
			} as ClientError;
		}
	}
}

/**
 * Not found error
 */
export const NotFound = new ErrorResponse(HttpStatus.NOT_FOUND,
	'The requested resource could not be found.',
	{
		errorCode: GlobalError.NotFoundError.code.toString(),
		errorMessage: GlobalError.NotFoundError.msg
	} as ClientError
);

/**
 * Unauthorized error
 */
export const Unauthorized = new ErrorResponse(HttpStatus.UNAUTHORIZED,
	'The user does not have the necessary credentials.',
	{
		errorCode: GlobalError.UnauthorizedError.code.toString(),
		errorMessage: GlobalError.UnauthorizedError.msg
	} as ClientError
);

/**
 * Forbidden error
 */
export const Forbidden = new ErrorResponse(HttpStatus.FORBIDDEN,
	'The user might not have the necessary permissions for a resource.',
	{
		errorCode: GlobalError.ForbiddenError.code.toString(),
		errorMessage: GlobalError.ForbiddenError.msg
	} as ClientError
);

/**
 * BadRequest error
 * @param exception
 * @returns
 */
export const BadRequest = (exception?: ClientError) => {
	return new ErrorResponse(HttpStatus.BAD_REQUEST,
		'The server cannot or will not process the request due to an apparent client error',
		exception);
};

/**
 * InternalServerError error
 * @param exception
 * @returns
 */
export const InternalServerError = (exception?: ClientError) => {
	return new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
		'An unexpected condition was encountered and no more specific message is suitable',
		exception);
};
