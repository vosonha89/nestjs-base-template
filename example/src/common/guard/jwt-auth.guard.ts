import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

/**
 * Global authentication guard.
 *
 * Every route requires a valid bearer token unless it carries `@Public()`.
 * Registered through `APP_GUARD` in `CommonModule`, so no controller has to
 * remember to add `@UseGuards()`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	/**
	 * Constructor
	 * @param reflector - Reads route and controller metadata
	 */
	public constructor(private readonly reflector: Reflector) {
		super();
	}

	/**
	 * Allows public routes through, otherwise defers to the passport strategy.
	 * @param context - Nest execution context
	 * @returns Whether the route may be reached
	 */
	public override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass()
		]);

		if (isPublic === true) {
			return true;
		}

		return super.canActivate(context);
	}
}
