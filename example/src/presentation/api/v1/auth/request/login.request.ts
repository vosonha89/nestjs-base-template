import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Payload accepted by `POST /api/v1/auth/login`.
 */
export class LoginRequest {
	/** Email address of the account. */
	@ApiProperty({ description: 'Email address of the account', example: 'admin@demo.io' })
	@IsNotEmpty({ message: 'email is required' })
	@IsEmail({}, { message: 'email must be a valid email address' })
	@MaxLength(255)
	public email!: string;

	/** Plain text password. */
	@ApiProperty({ description: 'Plain text password', example: 'Passw0rd!' })
	@IsNotEmpty({ message: 'password is required' })
	@IsString()
	@MaxLength(72)
	public password!: string;
}
