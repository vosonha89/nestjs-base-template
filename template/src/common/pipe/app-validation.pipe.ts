import { Injectable, Optional, ValidationError, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ClientError, ValidationAppError } from '../exception/client-error';
import { GlobalError } from '../exception/global-error';

/**
 * Constraint keys in the order they should be reported.
 * A missing required field must surface as `4001`, never as `4003 maxLength`.
 */
const CONSTRAINT_PRIORITY: readonly string[] = [
	'isNotEmpty',
	'arrayNotEmpty',
	'isDefined',
	'whitelistValidation',
	'maxLength',
	'minLength',
	'max',
	'min'
];

/**
 * Application wide request validation pipe.
 *
 * Wraps Nest's `ValidationPipe` so every rejection surfaces as an
 * {@link AppError} carrying a `ClientError` from the {@link GlobalError}
 * catalogue. `AllExceptionFilter` then renders the standard envelope, which
 * keeps the 4001-4008 contract that clients already depend on.
 *
 * Mounted globally in `CommonModule`, and passed explicitly as
 * `@Body(new AppValidationPipe({ expectedType: XxxRequest }))` inside
 * `BaseDataController` because the generic request type is erased at runtime.
 */
@Injectable()
export class AppValidationPipe extends ValidationPipe {
	/**
	 * Constructor
	 * @param options - Overrides merged on top of the project defaults
	 */
	public constructor(@Optional() options?: ValidationPipeOptions) {
		super({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			// All constraints are collected so the most meaningful one can be
			// reported; lib default (`true`) stops at an arbitrary one.
			stopAtFirstError: false,
			transformOptions: { enableImplicitConversion: true },
			...options,
			exceptionFactory: (errors: ValidationError[]) => AppValidationPipe.toAppError(errors)
		});
	}

	/**
	 * Converts the most relevant `class-validator` failure into the project envelope.
	 * @param errors - Failures reported by `class-validator`
	 * @returns The error to throw
	 */
	private static toAppError(errors: ValidationError[]): ValidationAppError {
		const leaf = AppValidationPipe.firstLeaf(errors);

		if (leaf === null) {
			return new ValidationAppError(
				new ClientError(String(GlobalError.BadRequestError.code), GlobalError.BadRequestError.msg)
			);
		}

		const constraints = leaf.constraints ?? {};
		const constraintKey = AppValidationPipe.pickConstraint(constraints);

		if (constraintKey === undefined) {
			const required = GlobalError.RequiredError(leaf.property);
			return new ValidationAppError(new ClientError(String(required.code), required.msg));
		}

		const resolved = GlobalError.fromConstraint(constraintKey, leaf.property, constraints[constraintKey]);
		return new ValidationAppError(new ClientError(String(resolved.code), resolved.msg));
	}

	/**
	 * Walks the error tree down to the first node that actually carries a constraint.
	 *
	 * Without this, a failure inside `filters[0].fieldName` is reported against
	 * `filters` as "filters is required", which is both wrong and confusing.
	 * @param errors - Current level of the error tree
	 * @returns The first leaf with constraints, or `null`
	 */
	private static firstLeaf(errors: ValidationError[]): ValidationError | null {
		for (const error of errors) {
			const constraints = error.constraints ?? {};

			if (Object.keys(constraints).length > 0) {
				return error;
			}

			if (error.children !== undefined && error.children.length > 0) {
				const child = AppValidationPipe.firstLeaf(error.children);

				if (child !== null) {
					return child;
				}
			}
		}

		return null;
	}

	/**
	 * Picks the constraint that best describes the failure.
	 * @param constraints - Constraint key to message map reported by `class-validator`
	 * @returns The chosen key, or `undefined` when there is none
	 */
	private static pickConstraint(constraints: Record<string, string>): string | undefined {
		for (const key of CONSTRAINT_PRIORITY) {
			if (constraints[key] !== undefined) {
				return key;
			}
		}

		return Object.keys(constraints)[0];
	}
}
