import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BaseCreateRequest } from '@common/base/base.request';

/**
 * Payload accepted by `POST /api/v1/user`.
 */
export class UserCreateRequest extends BaseCreateRequest {
	/** Login email address. */
	@ApiProperty({ description: 'Login email address', example: 'jane@demo.io' })
	@IsNotEmpty({ message: 'email is required' })
	@IsEmail({}, { message: 'email must be a valid email address' })
	@MaxLength(255)
	public email!: string;

	/**
	 * Plain text password.
	 *
	 * Capped at 72 characters because bcrypt ignores everything beyond that
	 * boundary — accepting longer values would silently weaken the hash.
	 */
	@ApiProperty({ description: 'Plain text password (8-72 characters)', example: 'Str0ngPassw0rd!' })
	@IsNotEmpty({ message: 'password is required' })
	@IsString()
	@MinLength(8, { message: 'password must be at least 8 characters long' })
	@MaxLength(72, { message: 'password cannot be longer than 72 characters' })
	public password!: string;

	/** Display name. */
	@ApiProperty({ description: 'Display name', required: false, example: 'Jane Doe' })
	@IsOptional()
	@IsString()
	@MaxLength(120)
	public fullName?: string;

	/** Role used by `RolesGuard`. */
	@ApiProperty({ description: 'Role', required: false, default: 'user', example: 'user' })
	@IsOptional()
	@IsString()
	@MaxLength(32)
	public role?: string;

	/** Whether the account may sign in. */
	@ApiProperty({ description: 'Whether the account may sign in', required: false, default: true })
	@IsOptional()
	@IsBoolean()
	public isActive?: boolean;
}
