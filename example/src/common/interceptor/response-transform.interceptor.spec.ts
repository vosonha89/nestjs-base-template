import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { ResponseTransformInterceptor } from './response-transform.interceptor';

/**
 * Builds a minimal HTTP execution context.
 * @returns The stub
 */
function createContext(): ExecutionContext {
	return {
		getType: () => 'http',
		getClass: () => class Stub {},
		getHandler: () => () => undefined,
		switchToHttp: () => ({
			getRequest: () => ({}),
			getResponse: () => ({})
		})
	} as unknown as ExecutionContext;
}

/**
 * Builds a handler that emits the supplied payload.
 * @param payload - Value the handler resolves to
 * @returns The stub
 */
function createHandler(payload: unknown): CallHandler {
	return { handle: () => of(payload) };
}

describe('ResponseTransformInterceptor', () => {
	let interceptor: ResponseTransformInterceptor;

	beforeEach(() => {
		interceptor = new ResponseTransformInterceptor(new Reflector());
	});

	it('should drop undefined object keys and render undefined array entries as null', async () => {
		const stream = await interceptor.intercept(
			createContext(),
			createHandler({ a: undefined, b: [1, undefined], c: { d: undefined } })
		);

		// Object keys holding `undefined` are omitted (no null noise in the
		// envelope), while array slots must be preserved, so they become `null`.
		await expect(firstValueFrom(stream)).resolves.toEqual({ b: [1, null], c: {} });
	});

	it('should keep defined nested values intact', async () => {
		const stream = await interceptor.intercept(
			createContext(),
			createHandler({ a: 1, c: { d: 'kept', e: undefined } })
		);

		await expect(firstValueFrom(stream)).resolves.toEqual({ a: 1, c: { d: 'kept' } });
	});

	it('should serialise Date as an ISO string', async () => {
		const stream = await interceptor.intercept(
			createContext(),
			createHandler({ at: new Date('2026-01-01T00:00:00.000Z') })
		);

		await expect(firstValueFrom(stream)).resolves.toEqual({ at: '2026-01-01T00:00:00.000Z' });
	});

	it('should keep primitives untouched', async () => {
		const stream = await interceptor.intercept(createContext(), createHandler('plain'));

		await expect(firstValueFrom(stream)).resolves.toEqual('plain');
	});
});
