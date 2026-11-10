import { Column, Entity, Index } from 'typeorm';
import { BigIntPrimaryColumn } from '../decorator/bigint-column.decorator';
import { PsqlEntity } from './psql.entity';

/**
 * Represents a user account.
 * @extends PsqlEntity
 */
@Entity({ name: 'user', schema: 'public' })
export class UserEntity extends PsqlEntity<number> {
	/** Unique identifier for the user. */
	@BigIntPrimaryColumn()
	public override id!: number;

	/** Login email address, unique across all users. */
	@Index('idx_user_email', { unique: true })
	@Column({ type: 'text' })
	public email!: string;

	/**
	 * bcrypt hash of the password.
	 *
	 * `select: false` keeps the hash out of every default query, so it can only
	 * reach the application when a repository explicitly asks for it.
	 */
	@Column({ type: 'text', select: false })
	public password!: string;

	/** Display name of the user. */
	@Column({ name: 'fullName', type: 'text', nullable: true })
	public fullName?: string;

	/** Role used by `RolesGuard`. */
	@Column({ type: 'text', default: 'user' })
	public role!: string;

	/** Whether the account may sign in. */
	@Column({ name: 'isActive', type: 'boolean', default: true })
	public isActive!: boolean;
}
