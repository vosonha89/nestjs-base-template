import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { ILoggingService } from '../service/logging.service.interface';
import { RequestWithUser } from '../type/request-with-user.type';
import { LoggingInterceptor } from './logging.interceptor';

/**
 * Builds an execution context over a request fixture.
 * @param request - Request the context returns
 * @returns The stubbed context
 */
function contextFor(request: Partial<RequestWithUser>): ExecutionContext {
	return {
		switchToHttp: () => ({ getRequest: () => request })
	} as unknown as ExecutionContext;
}

describe('LoggingInterceptor', () => {
	let logging: jest.Mocked<Pick<ILoggingService, 'info'>>;
	let interceptor: LoggingInterceptor;

	beforeEach(() => {
		logging = { info: jest.fn() };
		interceptor = new LoggingInterceptor(logging as unknown as ILoggingService);
	});

	it('should write one access line on success, without the payload', async () => {
		const request = { method: 'GET', originalUrl: '/api/v1/user/1', requestId: 'rid-1' };
		const next: CallHandler = { handle: () => of({ secret: 'should-not-be-logged' }) };

		await lastValueFrom(interceptor.intercept(contextFor(request), next));

		expect(logging.info).toHaveBeenCalledTimes(1);

		const [message, context, meta] = logging.info.mock.calls[0];

		expect(message).toMatch(/^GET \/api\/v1\/user\/1 -> completed in \d+ms$/);
		expect(context).toEqual('LoggingInterceptor');
		expect(meta).toEqual({ requestId: 'rid-1', durationMs: expect.any(Number) });
		// The body must never reach the sink.
		expect(JSON.stringify(logging.info.mock.calls)).not.toContain('should-not-be-logged');
	});

	it('should label the outcome with the error class on failure', async () => {
		const next: CallHandler = { handle: () => throwError(() => new TypeError('boom')) };

		await expect(
			lastValueFrom(interceptor.intercept(contextFor({ method: 'POST', originalUrl: '/api/v1/x' }), next))
		).rejects.toThrow('boom');

		expect(logging.info.mock.calls[0][0]).toMatch(/-> TypeError in \d+ms$/);
	});

	it('should fall back to a generic label for a non Error rejection', async () => {
		const next: CallHandler = { handle: () => throwError(() => 'plain string') };

		await expect(
			lastValueFrom(interceptor.intercept(contextFor({ method: 'PUT', originalUrl: '/api/v1/x' }), next))
		).rejects.toBe('plain string');

		expect(logging.info.mock.calls[0][0]).toMatch(/-> failed in \d+ms$/);
	});
});
