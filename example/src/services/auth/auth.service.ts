import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BaseService } from '@common/base/base.service';
import { AppError, ClientError } from '@common/exception/client-error';
import { GlobalError } from '@common/exception/global-error';
import { IAccessTokenPayload } from '@common/guard/jwt.strategy';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { IRequestContextService } from '@common/service/request-context.service.interface';
import { IJwtConfig } from '@config/config.type';
import { UserServiceSymbol } from '../user/user.service';
import { IUserService } from '../user/user.service.interface';
import { AuthTokenDto } from './auth.dto';
import { IAuthService, ILoginInput } from './auth.service.interface';

/**
 * Service symbol for DI register
 */
export const AuthServiceSymbol = Symbol('AuthService');

/**
 * Handles credential verification and token issuance.
 *
 * Authentication logic lives here rather than in the controller, which is the
 * main structural change compared to the original template.
 * @extends BaseService
 * @implements IAuthService
 */
@Injectable()
export class AuthService extends BaseService implements IAuthService {
	/**
	 * Constructor
	 * @param requestContext - Service exposing the current request
	 * @param userService - Business service used to verify credentials
	 * @param jwtService - Token signer configured by `CommonModule`
	 * @param configService - Resolved application configuration
	 */
	public constructor(
		@Inject(RequestContextServiceSymbol) requestContext: IRequestContextService,
		@Inject(UserServiceSymbol) private readonly userService: IUserService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService
	) {
		super(requestContext);
	}

	/**
	 * Verifies credentials and issues an access token.
	 *
	 * The error message is intentionally identical for "unknown email" and
	 * "wrong password" so the endpoint cannot be used for user enumeration.
	 * @param input - Credentials supplied by the caller
	 * @returns The token and the authenticated profile
	 * @throws AppError `401` when the credentials are invalid
	 */
	public async login(input: ILoginInput): Promise<AuthTokenDto> {
		const user = await this.userService.validateUser(input.email, input.password);

		if (user === null) {
			const message = GlobalError.UnauthorizedError;
			throw new AppError(
				HttpStatus.UNAUTHORIZED,
				new ClientError(String(message.code), 'Invalid email or password.')
			);
		}

		const payload: IAccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
		const jwt = this.configService.getOrThrow<IJwtConfig>('jwt');

		const result = new AuthTokenDto();
		result.accessToken = await this.jwtService.signAsync(payload);
		result.tokenType = 'Bearer';
		result.expiresIn = jwt.expiresIn;
		result.user = user;

		return result;
	}
}
