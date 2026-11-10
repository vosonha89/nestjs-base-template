import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../type/request-with-user.type';
import { UserInfo } from '../type/user-info.type';

/**
 * Injects the authenticated principal into a controller handler.
 *
 * Returns `undefined` on `@Public()` routes, which is why the parameter should
 * be declared optional.
 * @example
 * public async me(@CurrentUser() user?: UserInfo): Promise<UserInfo> { ... }
 */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): UserInfo | undefined => {
	return context.switchToHttp().getRequest<RequestWithUser>().user;
});
