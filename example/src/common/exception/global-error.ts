import { HttpStatus } from '@nestjs/common';
import { ErrorMessage } from './client-error';

/**
 * Central catalogue of application errors.
 *
 * Every entry is a {@link ErrorMessage} whose `code` is either a plain HTTP
 * status (`404`) or a fine grained validation code derived from it
 * (`400 * 10 + n`). Keeping them in one place makes the API contract
 * grep-able and prevents typos in the client.
 */
export class GlobalError {
	/** HTTP 500 — unexpected server failure. */
	public static readonly InternalServerError: ErrorMessage = {
		code: HttpStatus.INTERNAL_SERVER_ERROR,
		msg: 'InternalServerError'
	};

	/** HTTP 400 — generic bad request. */
	public static readonly BadRequestError: ErrorMessage = {
		code: HttpStatus.BAD_REQUEST,
		msg: 'BadRequestError'
	};

	/** HTTP 401 — missing or invalid credentials. */
	public static readonly UnauthorizedError: ErrorMessage = {
		code: HttpStatus.UNAUTHORIZED,
		msg: 'UnauthorizedError'
	};

	/** HTTP 403 — authenticated but not allowed. */
	public static readonly ForbiddenError: ErrorMessage = {
		code: HttpStatus.FORBIDDEN,
		msg: 'ForbiddenError'
	};

	/** HTTP 404 — resource does not exist. */
	public static readonly NotFoundError: ErrorMessage = {
		code: HttpStatus.NOT_FOUND,
		msg: 'NotFoundError'
	};

	/** HTTP 409 — uniqueness or state conflict. */
	public static readonly ConflictError: ErrorMessage = {
		code: HttpStatus.CONFLICT,
		msg: 'ConflictError'
	};

	/** HTTP 429 — rate limit exceeded. */
	public static readonly TooManyRequestsError: ErrorMessage = {
		code: HttpStatus.TOO_MANY_REQUESTS,
		msg: 'TooManyRequestsError'
	};

	/** `4001` — a required field is missing. */
	public static readonly RequiredError = (fieldName: string): ErrorMessage => ({
		code: HttpStatus.BAD_REQUEST * 10 + 1,
		msg: `${fieldName.trim()} is required.`
	});

	/** `4002` — a field has the wrong type or format. */
	public static readonly TypeError = (fieldName: string, fieldType: string): ErrorMessage => ({
		code: HttpStatus.BAD_REQUEST * 10 + 2,
		msg: `${fieldName.trim()} is not a valid ${fieldType} type.`
	});

	/** `4003` — a string is longer than allowed. */
	public static readonly MaxLengthError = (fieldName: string, maxLength: number): ErrorMessage => ({
		code: HttpStatus.BAD_REQUEST * 10 + 3,
		msg: `${fieldName.trim()} cannot be longer than ${maxLength} characters.`
	});

	/** `4004` — a string is shorter than required. */
	public static readonly MinLengthError = (fieldName: string, minLength: number): ErrorMessage => ({
		code: HttpStatus.BAD_REQUEST * 10 + 4,
		msg: `${fieldName.trim()} must be at least ${minLength} characters long.`
	});

	/** `4005` — a number exceeds its upper bound. */
	public static readonly MaxValueError = (fieldName: string, maxValue: number | Date): ErrorMessage => ({
		code: HttpStatus.BAD_REQUEST * 10 + 5,
		msg: `${fieldName.trim()} cannot be greater than ${String(maxValue)}.`
	});

	/** `4006` — a number is below its lower bound. */
	public static readonly MinValueError = (fieldName: string, minValue: number | Date): ErrorMessage => ({
		code: HttpStatus.BAD_REQUEST * 10 + 6,
		msg: `${fieldName.trim()} must be at least ${String(minValue)}.`
	});

	/** `4007` — the field is not part of the searchable/sortable whitelist. */
	public static readonly NotAllowedFieldError = (fieldName: string): ErrorMessage => ({
		code: HttpStatus.BAD_REQUEST * 10 + 7,
		msg: `${fieldName.trim()} is not allowed in this operation.`
	});

	/** `4008` — a business rule about quantities was violated. */
	public static readonly InsufficientQuantityError = (available: number, requested: number): ErrorMessage => ({
		code: HttpStatus.BAD_REQUEST * 10 + 8,
		msg: `Insufficient quantity. Available: ${available}, requested: ${requested}.`
	});

	/**
	 * Translates a `class-validator` constraint key into the numeric catalogue above.
	 *
	 * This is what keeps the 4001-4006 contract alive while validation is
	 * delegated to the framework instead of hand written `isValid()` methods.
	 * @param constraint - Constraint key reported by `class-validator`, e.g. `isNotEmpty`
	 * @param property - Property that failed validation
	 * @param defaultMessage - Message produced by `class-validator`, used when no catalogue entry fits
	 * @returns The matching {@link ErrorMessage}
	 */
	public static readonly fromConstraint = (
		constraint: string,
		property: string,
		defaultMessage?: string
	): ErrorMessage => ({
		// The numeric code always comes from the catalogue (4001-4006) so clients can
		// branch on it; the wording comes from `class-validator`, which honours the
		// `message` option declared on the DTO.
		code: GlobalError.constraintCode(constraint),
		msg:
			defaultMessage !== undefined && defaultMessage !== ''
				? defaultMessage
				: GlobalError.TypeError(property, 'valid').msg
	});

	/**
	 * Maps a constraint key onto the numeric code family.
	 * @param constraint - Constraint key reported by `class-validator`
	 * @returns The numeric code, always prefixed by `HttpStatus.BAD_REQUEST * 10`
	 */
	private static readonly constraintCode = (constraint: string): number => {
		switch (constraint) {
			case 'isNotEmpty':
			case 'arrayNotEmpty':
				return HttpStatus.BAD_REQUEST * 10 + 1;
			case 'maxLength':
				return HttpStatus.BAD_REQUEST * 10 + 3;
			case 'minLength':
				return HttpStatus.BAD_REQUEST * 10 + 4;
			case 'max':
				return HttpStatus.BAD_REQUEST * 10 + 5;
			case 'min':
				return HttpStatus.BAD_REQUEST * 10 + 6;
			default:
				return HttpStatus.BAD_REQUEST * 10 + 2;
		}
	};
}
