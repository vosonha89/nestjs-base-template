import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { AppError, ClientError } from '../exception/client-error';
import { GlobalError } from '../exception/global-error';
import { RequestWithUser } from '../type/request-with-user.type';

/**
 * Enforces the role list declared with `@Roles(...)`.
 *
 * Runs after {@link JwtAuthGuard}, so by the time it executes the principal is
 * already attached to the request. Routes without `@Roles()` are allowed
 * through, which keeps the guard opt-in for authorisation while authentication
 * stays opt-out.
 */
@Injectable()
export class RolesGuard implements CanActivate {
	/**
	 * Constructor
	 * @param reflector - Reads route and controller metadata
	 */
	public constructor(private readonly reflector: Reflector) {}

	/**
	 * Checks whether the authenticated principal owns one of the required roles.
	 * @param context - Nest execution context
	 * @returns `true` when the route may be reached
	 * @throws AppError `401` when no principal is present, `403` when the role does not match
	 */
	public canActivate(context: ExecutionContext): boolean {
		const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass()
		]);

		if (required === undefined || required.length === 0) {
			return true;
		}

		const user = context.switchToHttp().getRequest<RequestWithUser>().user;

		if (user === undefined) {
			const message = GlobalError.UnauthorizedError;
			throw new AppError(HttpStatus.UNAUTHORIZED, new ClientError(String(message.code), message.msg));
		}

		if (!required.includes(user.role)) {
			const message = GlobalError.ForbiddenError;
			throw new AppError(
				HttpStatus.FORBIDDEN,
				new ClientError(String(message.code), `${message.msg} Required role: ${required.join(', ')}.`)
			);
		}

		return true;
	}
}
