import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponse, OKResponse } from '@common/base/base.response';
import { Public } from '@common/decorator/public.decorator';
import { ErrorResponse } from '@common/exception/error-response';
import { AppValidationPipe } from '@common/pipe/app-validation.pipe';
import { AuthTokenDto } from '@services/auth/auth.dto';
import { AuthServiceSymbol } from '@services/auth/auth.service';
import { IAuthService } from '@services/auth/auth.service.interface';
import { LoginRequest } from './request/login.request';
import { LoginResponse } from './response/login.response';

/**
 * HTTP surface of the authentication feature.
 *
 * Thin by design: the credential check and token issuance live in
 * `AuthService`, which is the main structural difference from the original
 * template where the controller held the logic and called the user service
 * directly.
 */
@ApiTags('auth')
@ApiExtraModels(LoginResponse)
@Controller({ path: 'auth', version: '1' })
export class AuthController {
	/**
	 * Constructor
	 * @param authService - Business service handling authentication
	 */
	public constructor(@Inject(AuthServiceSymbol) private readonly authService: IAuthService) {}

	/**
	 * Exchanges credentials for an access token.
	 * @param request - Validated credentials
	 * @returns The token wrapped in the standard envelope
	 */
	@Public()
	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Exchange credentials for an access token' })
	@ApiBody({ type: LoginRequest })
	@ApiOkResponse({ description: 'Access token and authenticated profile', type: LoginResponse })
	@ApiResponse({ status: 400, description: 'BadRequest', type: ErrorResponse })
	@ApiResponse({ status: 401, description: 'Invalid credentials', type: ErrorResponse })
	@ApiResponse({ status: 429, description: 'TooManyRequests', type: ErrorResponse })
	public async login(
		@Body(new AppValidationPipe({ expectedType: LoginRequest })) request: LoginRequest
	): Promise<BaseResponse<AuthTokenDto>> {
		const result = await this.authService.login({ email: request.email, password: request.password });
		return OKResponse<AuthTokenDto>(result);
	}
}
