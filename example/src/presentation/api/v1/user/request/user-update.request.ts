import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BaseUpdateRequest } from '@common/base/base.request';

/**
 * Payload accepted by `PUT /api/v1/user/:id`.
 * Every field is optional: only the ones present are written.
 */
export class UserUpdateRequest extends BaseUpdateRequest {
	/** Login email address. */
	@ApiProperty({ description: 'Login email address', required: false, example: 'jane@demo.io' })
	@IsOptional()
	@IsEmail({}, { message: 'email must be a valid email address' })
	@MaxLength(255)
	public email?: string;

	/**
	 * New plain text password.
	 * Send an empty string to leave the current password untouched.
	 */
	@ApiProperty({
		description: 'New plain text password (8-72 characters). Empty string keeps the current one.',
		required: false
	})
	@IsOptional()
	@IsString()
	@MinLength(8, { message: 'password must be at least 8 characters long' })
	@MaxLength(72, { message: 'password cannot be longer than 72 characters' })
	public password?: string;

	/** Display name. */
	@ApiProperty({ description: 'Display name', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(120)
	public fullName?: string;

	/** Role used by `RolesGuard`. */
	@ApiProperty({ description: 'Role', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(32)
	public role?: string;

	/** Whether the account may sign in. */
	@ApiProperty({ description: 'Whether the account may sign in', required: false })
	@IsOptional()
	@IsBoolean()
	public isActive?: boolean;
}
