import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtConfig } from '../../config/config.type';
import { UserInfo } from '../type/user-info.type';

/**
 * Claims carried by the access token issued by `AuthService`.
 */
export interface IAccessTokenPayload {
	/** User identifier. */
	sub: number;

	/** Email address of the user. */
	email: string;

	/** Role used by `RolesGuard`. */
	role: string;
}

/**
 * Verifies bearer tokens and maps their claims onto {@link UserInfo}.
 *
 * The secret is read from `ConfigService` (never from `process.env` directly)
 * so it is guaranteed to be the validated value, and so tests can inject a
 * different one.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	/**
	 * Constructor
	 * @param configService - Resolved application configuration
	 */
	public constructor(configService: ConfigService) {
		const jwt = configService.getOrThrow<IJwtConfig>('jwt');

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwt.secret
		});
	}

	/**
	 * Converts verified claims into the principal stored on `request.user`.
	 * @param payload - Verified token claims
	 * @returns The authenticated principal
	 */
	public validate(payload: IAccessTokenPayload): UserInfo {
		const user = new UserInfo();
		user.id = payload.sub;
		user.email = payload.email;
		user.role = payload.role;
		return user;
	}
}
