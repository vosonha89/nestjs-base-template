import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ResponseTransformInterceptor extends ClassSerializerInterceptor implements NestInterceptor {
	constructor(reflector: Reflector) {
		super(reflector, {
			strategy: 'exposeAll',
			exposeUnsetFields: false, // Remove undefined fields by default
		});
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		return next.handle().pipe(
			map((data: unknown) => this.transformUndefinedToNull(data)),
		);
	}

	private transformUndefinedToNull(data: unknown): unknown {
		// Handle null, non-objects, arrays, and Date objects
		if (!data || typeof data !== 'object' || Array.isArray(data)) {
			return data;
		}
		if (data instanceof Date) {
			return data.toISOString(); // Convert Date to ISO string
		}

		return Object.entries(data).reduce((acc: Record<string, unknown>, [key, value]: [string, unknown]) => {
			acc[key] = value === undefined ? null : this.transformUndefinedToNull(value);
			return acc;
		}, {});
	}
}
