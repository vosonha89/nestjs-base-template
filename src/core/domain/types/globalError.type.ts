import { HttpStatus } from '@nestjs/common';
import { ErrorMessage } from '../common/base/base.exceptions';

/**
 * Global error
 */
export class GlobalError {
	public static readonly InternalServerError = {
		code: HttpStatus.INTERNAL_SERVER_ERROR,
		msg: 'InternalServerError'
	} as ErrorMessage;
	public static readonly BadRequestError = {
		code: HttpStatus.BAD_REQUEST,
		msg: 'BadRequestError'
	} as ErrorMessage;
	public static readonly UnauthorizedError = {
		code: HttpStatus.UNAUTHORIZED,
		msg: 'UnauthorizedError'
	} as ErrorMessage;
	public static readonly ForbiddenError = {
		code: HttpStatus.FORBIDDEN,
		msg: 'ForbiddenError'
	} as ErrorMessage;
	public static readonly NotFoundError = {
		code: HttpStatus.NOT_FOUND,
		msg: 'NotFoundError'
	} as ErrorMessage;
	public static readonly RequiredError = (fieldName: string) => {
		return {
			code: HttpStatus.BAD_REQUEST * 10 + 1,
			msg: fieldName.trim() + ' is required.'
		} as ErrorMessage;
	}
	public static readonly TypeError = (fieldName: string, fieldType: string) => {
		return {
			code: HttpStatus.BAD_REQUEST * 10 + 2,
			msg: fieldName.trim() + ' is not valid ' + fieldType + ' type.'
		} as ErrorMessage;
	}
	public static readonly MaxLengthError = (fieldName: string, maxLength: number) => {
		return {
			code: HttpStatus.BAD_REQUEST * 10 + 3,
			msg: fieldName.trim() + ' cannot be longer than ' + maxLength + ' characters.'
		} as ErrorMessage;
	}
	public static readonly MinLengthError = (fieldName: string, minLength: number) => {
		return {
			code: HttpStatus.BAD_REQUEST * 10 + 4,
			msg: fieldName.trim() + ' must be at least ' + minLength + ' characters long.'
		} as ErrorMessage;
	}
	public static readonly MaxValueError = (fieldName: string, maxValue: number | Date) => {
		return {
			code: HttpStatus.BAD_REQUEST * 10 + 5,
			msg: fieldName.trim() + ' cannot be greater than ' + String(maxValue) + '.'
		} as ErrorMessage;
	}
	public static readonly MinValueError = (fieldName: string, minValue: number | Date) => {
		return {
			code: HttpStatus.BAD_REQUEST * 10 + 6,
			msg: fieldName.trim() + ' must be at least ' + String(minValue) + '.'
		} as ErrorMessage;
	}
}
