import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createUserInfo } from '@test/support/test-doubles';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { AppError } from '../exception/client-error';
import { UserInfo } from '../type/user-info.type';
import { RolesGuard } from './roles.guard';

/**
 * Builds an execution context carrying an optional principal.
 * @param user - Principal attached to the request
 * @returns The stub context
 */
function createContext(user?: UserInfo): ExecutionContext {
	return {
		getHandler: () => () => undefined,
		getClass: () => class Stub {},
		switchToHttp: () => ({ getRequest: () => ({ user }) })
	} as unknown as ExecutionContext;
}

/**
 * Builds a reflector returning a fixed role list.
 * @param roles - Roles declared on the route
 * @returns The stub reflector
 */
function createReflector(roles?: string[]): Reflector {
	return { getAllAndOverride: jest.fn(() => roles) } as unknown as Reflector;
}

describe('RolesGuard', () => {
	it('should allow the route when no role is required', () => {
		const guard = new RolesGuard(createReflector(undefined));

		expect(guard.canActivate(createContext())).toBe(true);
	});

	it('should allow the route when an empty role list is declared', () => {
		const guard = new RolesGuard(createReflector([]));

		expect(guard.canActivate(createContext())).toBe(true);
	});

	it('should allow the principal holding a required role', () => {
		const guard = new RolesGuard(createReflector(['admin', 'owner']));

		expect(guard.canActivate(createContext(createUserInfo({ role: 'owner' })))).toBe(true);
	});

	it('should reject with 403 when the role does not match', () => {
		const guard = new RolesGuard(createReflector(['admin']));

		expect(() => guard.canActivate(createContext(createUserInfo({ role: 'user' })))).toThrow(AppError);

		try {
			guard.canActivate(createContext(createUserInfo({ role: 'user' })));
		} catch (error) {
			expect((error as AppError).httpStatus).toEqual(HttpStatus.FORBIDDEN);
			expect((error as AppError).exception.errorCode).toEqual('403');
		}
	});

	it('should reject with 401 when the route is protected but anonymous', () => {
		const guard = new RolesGuard(createReflector(['admin']));

		try {
			guard.canActivate(createContext());
			fail('expected canActivate to throw');
		} catch (error) {
			expect((error as AppError).httpStatus).toEqual(HttpStatus.UNAUTHORIZED);
		}
	});

	it('should read the metadata from the handler and the class', () => {
		const reflector = createReflector(['admin']);

		new RolesGuard(reflector).canActivate(createContext(createUserInfo()));

		expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
			expect.any(Function),
			expect.any(Function)
		]);
	});
});
