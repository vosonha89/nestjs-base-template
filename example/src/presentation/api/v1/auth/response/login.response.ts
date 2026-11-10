import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseData } from '@common/base/base.response';
import { AuthTokenDto } from '@services/auth/auth.dto';

/**
 * Swagger model describing a successful login response.
 */
export class LoginResponse extends BaseResponseData<AuthTokenDto> {
	/** Token and authenticated profile. */
	@ApiProperty({ type: () => AuthTokenDto })
	public override data?: AuthTokenDto;
}
