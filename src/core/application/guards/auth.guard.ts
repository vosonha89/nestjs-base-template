import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard for handling JWT authentication
 */
@Injectable()
export class AuthGuard implements CanActivate {
	/**
	 * Creates an instance of AuthGuard
	 * @param jwtService - The JWT service for token verification
	 * @param reflector - The reflector for metadata access
	 */
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector,
	) { }

	/**
	 * Determines if the route can be activated
	 * @param context - The execution context
	 * @returns True if the route can be activated
	 */
	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromHeader(request);
		if (!token) {
			throw new UnauthorizedException('Missing authentication token');
		}
		try {
			const payload = await this.jwtService.verifyAsync(
				token,
				{
					secret: process.env.JWT_SECRET ?? 'defaultSecretKey',
				}
			);
			request['user'] = payload;
		} catch {
			throw new UnauthorizedException('Invalid or expired authentication token');
		}
		return true;
	}

	/**
	 * Extracts the JWT token from the authorization header
	 * @param request - The HTTP request
	 * @returns The token string or undefined
	 */
	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
