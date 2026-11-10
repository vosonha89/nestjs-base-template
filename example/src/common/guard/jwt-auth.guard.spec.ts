import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Builds a minimal execution context.
 * @returns The stub context
 */
function createContext(): ExecutionContext {
	return {
		getHandler: () => () => undefined,
		getClass: () => class Stub {},
		switchToHttp: () => ({ getRequest: () => ({}) })
	} as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
	it('should let a @Public() route through without invoking passport', () => {
		const reflector = { getAllAndOverride: jest.fn(() => true) } as unknown as Reflector;
		const guard = new JwtAuthGuard(reflector);

		expect(guard.canActivate(createContext())).toBe(true);
	});

	it('should read the public flag from the handler and the class', () => {
		const reflector = { getAllAndOverride: jest.fn(() => true) } as unknown as Reflector;
		const guard = new JwtAuthGuard(reflector);

		void guard.canActivate(createContext());

		expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
			expect.any(Function),
			expect.any(Function)
		]);
	});

	// The protected branch delegates to the passport strategy registry, which has
	// no strategy registered in a unit test and throws from inside `@nestjs/passport`.
	// It is exercised end to end by `test/app.e2e-spec.ts` instead.
});
