import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '@common/base/base.entity';

/**
 * PostgreSQL flavour of {@link BaseEntity}.
 *
 * Audit columns are managed by TypeORM and stored as `timestamptz`, so the
 * time component survives — the original template used `type: 'date'`, which
 * silently truncated every timestamp to midnight.
 * @template TId - Type of the identifier field
 */
export abstract class PsqlEntity<TId> extends BaseEntity<TId> {
	/** Unique identifier of the entity. Declared by the concrete entity. */
	public abstract override id: TId;

	/** Timestamp when the row was inserted. Managed by TypeORM. */
	@CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
	public override createdAt!: Date;

	/** Timestamp of the last modification. Managed by TypeORM. */
	@UpdateDateColumn({ name: 'updatedAt', type: 'timestamptz' })
	public override updatedAt!: Date;

	/** Timestamp of the soft delete. `null` while the row is active. */
	@DeleteDateColumn({ name: 'deletedAt', type: 'timestamptz', nullable: true })
	public deletedAt?: Date | null;
}
