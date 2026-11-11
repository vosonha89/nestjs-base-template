import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';
import { UserInfo } from '../type/user-info.type';

/**
 * The parameter metadata Nest stores for a decorated handler.
 */
interface IRouteArgMetadata {
	readonly factory: (data: unknown, context: ExecutionContext) => UserInfo | undefined;
	readonly data: unknown;
}

/**
 * Controller whose handler uses the decorator, so Nest registers the factory in
 * `ROUTE_ARGS_METADATA`. Nest 12 no longer exposes `.factory` on the decorator
 * itself, so the metadata is the supported way in.
 */
class SampleController {
	/**
	 * Handler carrying `@CurrentUser()`.
	 * @param user - Injected principal
	 * @returns The principal, unchanged
	 */
	public read(@CurrentUser() user?: UserInfo): UserInfo | undefined {
		return user;
	}
}

/**
 * Reads the registered parameter metadata for `SampleController.read`.
 * @returns The first registered route argument
 */
function routeArg(): IRouteArgMetadata {
	const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, SampleController, 'read') as Record<
		string,
		IRouteArgMetadata
	>;

	const entry = Object.values(metadata)[0];

	if (entry === undefined) {
		throw new Error('@CurrentUser() registered no parameter metadata');
	}

	return entry;
}

/**
 * Builds an execution context whose request carries a principal.
 * @param user - Principal to expose, or `undefined` for an anonymous route
 * @returns The stubbed context
 */
function contextWith(user: UserInfo | undefined): ExecutionContext {
	return {
		switchToHttp: () => ({ getRequest: () => ({ user }) })
	} as unknown as ExecutionContext;
}

describe('CurrentUser', () => {
	it('should return the principal attached by JwtStrategy', () => {
		const user = new UserInfo();
		user.id = 7;
		user.email = 'user@example.test';

		const { factory, data } = routeArg();

		expect(factory(data, contextWith(user))).toBe(user);
	});

	it('should return undefined on a public route', () => {
		const { factory, data } = routeArg();

		expect(factory(data, contextWith(undefined))).toBeUndefined();
	});
});
