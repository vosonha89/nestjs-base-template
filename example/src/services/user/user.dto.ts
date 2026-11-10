import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseType } from '@common/base/base.type';

/**
 * Read model of a user.
 *
 * Only `@Expose()`-decorated properties are copied when an entity is mapped
 * onto this DTO, so a column added to `UserEntity` later cannot leak through
 * the API by accident.
 */
export class UserDto extends BaseType<number> {
	/** Unique identifier. */
	@Expose()
	@ApiProperty({ example: 1 })
	public id!: number;

	/** Login email address. */
	@Expose()
	@ApiProperty({ example: 'admin@demo.io' })
	public email!: string;

	/** Display name. */
	@Expose()
	@ApiProperty({ example: 'Demo Administrator', required: false })
	public fullName?: string;

	/** Role used by `RolesGuard`. */
	@Expose()
	@ApiProperty({ example: 'admin' })
	public role!: string;

	/** Whether the account may sign in. */
	@Expose()
	@ApiProperty({ example: true })
	public isActive!: boolean;

	/** Creation timestamp. */
	@Expose()
	@ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
	public createdAt!: Date;

	/** Last modification timestamp. */
	@Expose()
	@ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
	public updatedAt!: Date;

	/**
	 * Write-only password.
	 *
	 * Deliberately has no `@Expose()` and no `@ApiProperty()`: it is copied in
	 * when mapping a request onto the DTO, and dropped on the way out, so the
	 * hash can never reach a client.
	 */
	public password?: string;
}
