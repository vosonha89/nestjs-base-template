import { UserInfo } from '../type/user-info.type';
import { RequestWithUser } from '../type/request-with-user.type';
import { RequestContextService } from './request-context.service';
import { BcryptHashService } from './bcrypt-hash.service';
import { CorrelationIdMiddleware } from '../middleware/correlation-id.middleware';

describe('BcryptHashService', () => {
	const service = new BcryptHashService();

	it('should produce a bcrypt hash that verifies', async () => {
		const hashed = await service.hash('Secret123!');

		expect(hashed.startsWith('$2b$12$')).toBe(true);
		await expect(service.compare('Secret123!', hashed)).resolves.toBe(true);
	});

	it('should reject a wrong secret', async () => {
		const hashed = await service.hash('Secret123!');

		await expect(service.compare('Secret124!', hashed)).resolves.toBe(false);
	});

	it('should never produce the same hash twice', async () => {
		const first = await service.hash('same-secret');
		const second = await service.hash('same-secret');

		expect(first).not.toEqual(second);
	});
});

describe('RequestContextService', () => {
	let service: RequestContextService;

	beforeEach(() => {
		service = new RequestContextService();
	});

	/**
	 * Builds a request fixture.
	 * @returns The fixture
	 */
	function createRequest(): RequestWithUser {
		const user = new UserInfo();
		user.id = 1;
		user.email = 'admin@demo.io';
		user.role = 'admin';

		return {
			requestId: 'rid-1',
			headers: { 'accept-language': 'vi-VN', 'x-array': ['a', 'b'] },
			user
		} as unknown as RequestWithUser;
	}

	it('should return undefined outside a request scope', () => {
		expect(service.getRequest()).toBeUndefined();
		expect(service.getRequestId()).toBeUndefined();
		expect(service.getUser()).toBeUndefined();
	});

	it('should expose the request scoped values inside run()', () => {
		const request = createRequest();

		service.run(request, () => {
			expect(service.getRequest()).toBe(request);
			expect(service.getRequestId()).toEqual('rid-1');
			expect(service.getUser()?.email).toEqual('admin@demo.io');
			expect(service.getLanguage()).toEqual('vi-VN');
			expect(service.getHeader('x-array')).toEqual('a');
			expect(service.getHeader('missing')).toBeUndefined();
		});
	});

	it('should default the language to en when the header is absent', () => {
		service.run({ headers: {} } as unknown as RequestWithUser, () => {
			expect(service.getLanguage()).toEqual('en');
		});
	});

	it('should return the callback result', () => {
		expect(service.run(createRequest(), () => 42)).toEqual(42);
	});
});

describe('CorrelationIdMiddleware', () => {
	let contextService: { run: jest.Mock };
	let middleware: CorrelationIdMiddleware;
	let response: { setHeader: jest.Mock };
	let next: jest.Mock;

	beforeEach(() => {
		contextService = { run: jest.fn((_request: unknown, callback: () => void) => callback()) };
		middleware = new CorrelationIdMiddleware(contextService as never);
		response = { setHeader: jest.fn() };
		next = jest.fn();
	});

	it('should reuse a well formed inbound correlation id', () => {
		middleware.use({ headers: { 'x-request-id': 'abc-123_OK' } } as never, response as never, next);

		expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'abc-123_OK');
		expect(next).toHaveBeenCalledTimes(1);
	});

	it('should generate a uuid when the inbound id contains unsafe characters', () => {
		middleware.use({ headers: { 'x-request-id': 'bad id with spaces' } } as never, response as never, next);

		const generated = response.setHeader.mock.calls[0][1] as string;
		expect(generated).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('should generate a uuid when no correlation id is supplied', () => {
		middleware.use({ headers: {} } as never, response as never, next);

		expect(response.setHeader.mock.calls[0][1]).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('should open the async context before continuing', () => {
		const request = { headers: {} };

		middleware.use(request as never, response as never, next);

		expect(contextService.run).toHaveBeenCalledWith(request, expect.any(Function));
		expect(request).toHaveProperty('requestId');
	});
});
