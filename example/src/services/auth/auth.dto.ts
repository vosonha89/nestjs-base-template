import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../user/user.dto';

/**
 * Result of a successful login.
 */
export class AuthTokenDto {
	/** Signed JWT to send as `Authorization: Bearer <token>`. */
	@ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
	public accessToken!: string;

	/** Scheme expected in the `Authorization` header. */
	@ApiProperty({ example: 'Bearer' })
	public tokenType!: string;

	/** Token lifetime, as configured through `JWT_EXPIRES_IN`. */
	@ApiProperty({ example: '1d' })
	public expiresIn!: string;

	/** Profile of the authenticated user. */
	@ApiProperty({ type: () => UserDto })
	public user!: UserDto;
}
