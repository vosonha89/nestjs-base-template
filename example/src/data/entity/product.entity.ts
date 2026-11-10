import { Column, Entity, Index } from 'typeorm';
import { BigIntPrimaryColumn, numericTransformer } from '../decorator/bigint-column.decorator';
import { PsqlEntity } from './psql.entity';

/**
 * Represents a sellable product.
 * @extends PsqlEntity
 */
@Entity({ name: 'product', schema: 'public' })
export class ProductEntity extends PsqlEntity<number> {
	/** Unique identifier for the product. */
	@BigIntPrimaryColumn()
	public override id!: number;

	/** Human readable product name. */
	@Column({ type: 'text' })
	public name!: string;

	/** Stock keeping unit, unique across the catalogue. */
	@Index('idx_product_sku', { unique: true })
	@Column({ type: 'text' })
	public sku!: string;

	/** Long description. */
	@Column({ type: 'text', nullable: true })
	public description?: string;

	/** Free form category label. */
	@Column({ type: 'text', nullable: true })
	public category?: string;

	/**
	 * Unit price.
	 *
	 * Stored as `numeric(12,2)` — money must never be a `float`, otherwise
	 * rounding errors accumulate. The transformer keeps the value a JS number
	 * in the application while Postgres stores an exact decimal.
	 */
	@Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numericTransformer })
	public price!: number;

	/** Units currently available. */
	@Column({ type: 'integer', default: 0 })
	public stock!: number;

	/** Whether the product may be sold. */
	@Column({ name: 'isActive', type: 'boolean', default: true })
	public isActive!: boolean;
}
