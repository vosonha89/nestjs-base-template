import { Injectable, PipeTransform } from '@nestjs/common';
import { AppError, ClientError } from '../exception/client-error';
import { GlobalError } from '../exception/global-error';

/**
 * Validates and converts a path identifier.
 *
 * Accepts both shapes because the global `AppValidationPipe` may already have
 * coerced `'1'` into `1` before this pipe runs, depending on the declared
 * parameter type.
 *
 * Replaces the ad hoc `@Param('id') id: string` handling of the original
 * template, which silently accepted `undefined`, `'abc'` and `0`.
 */
@Injectable()
export class ParseEntityIdPipe implements PipeTransform<string | number, number> {
	/**
	 * Parses a positive integer identifier.
	 * @param value - Raw path segment, already coerced or still a string
	 * @returns The parsed identifier
	 * @throws AppError with a `4002` payload when the value is not a positive integer
	 */
	public transform(value: string | number): number {
		let parsed: number;

		if (typeof value === 'number') {
			parsed = value;
		} else {
			const trimmed = value.trim();

			// Reject `1.5`, `1e3`, `0x10` and friends: `Number.parseInt` would
			// silently truncate them into a different identifier.
			if (!/^\d+$/.test(trimmed)) {
				const message = GlobalError.TypeError('id', 'positive integer');
				throw new AppError(400, new ClientError(String(message.code), message.msg));
			}

			parsed = Number.parseInt(trimmed, 10);
		}

		if (!Number.isInteger(parsed) || parsed < 1) {
			const message = GlobalError.TypeError('id', 'positive integer');
			throw new AppError(400, new ClientError(String(message.code), message.msg));
		}

		return parsed;
	}
}
