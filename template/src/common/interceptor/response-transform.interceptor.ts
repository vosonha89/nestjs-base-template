import { CallHandler, ClassSerializerInterceptor, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Serialises every response and normalises `undefined` inside arrays to `null`.
 *
 * Two bugs from the original template are fixed here:
 * 1. `super.intercept()` is actually called, so the `@Exclude()`/`@Expose()`
 *    rules and the `exposeUnsetFields` option really apply. Before, they were
 *    silently ignored and the class was registered twice.
 * 2. `undefined` inside an array becomes `null` instead of being dropped, which
 *    would shift the indexes a client is relying on. Object keys holding
 *    `undefined` are omitted entirely, which keeps the envelope clean.
 */
@Injectable()
export class ResponseTransformInterceptor extends ClassSerializerInterceptor implements NestInterceptor {
	/**
	 * Constructor
	 * @param reflector - Reads serialisation metadata from DTOs and controllers
	 */
	public constructor(reflector: Reflector) {
		super(reflector, {
			strategy: 'exposeAll',
			exposeUnsetFields: false
		});
	}

	/**
	 * Applies class-transformer serialisation, then replaces `undefined` with `null`.
	 * @param context - Nest execution context
	 * @param next - Remaining handler chain
	 * @returns The transformed stream
	 */
	public override async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
		const stream = await super.intercept(context, next);
		return stream.pipe(map((data: unknown) => this.undefinedToNull(data)));
	}

	/**
	 * Recursively replaces `undefined` with `null` and renders `Date` as ISO.
	 * @param value - Value to normalise
	 * @returns The normalised value
	 */
	private undefinedToNull(value: unknown): unknown {
		if (value === undefined || value === null) {
			return null;
		}

		if (value instanceof Date) {
			return value.toISOString();
		}

		if (Array.isArray(value)) {
			return value.map((item: unknown) => this.undefinedToNull(item));
		}

		if (typeof value === 'object') {
			const result: Record<string, unknown> = {};

			for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
				result[key] = this.undefinedToNull(entry);
			}

			return result;
		}

		return value;
	}
}
