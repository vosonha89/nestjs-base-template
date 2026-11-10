import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseType } from '@common/base/base.type';

/**
 * Read model of a product.
 *
 * Only `@Expose()`-decorated properties are copied out of the entity.
 */
export class ProductDto extends BaseType<number> {
	/** Unique identifier. */
	@Expose()
	@ApiProperty({ example: 1 })
	public id!: number;

	/** Product name. */
	@Expose()
	@ApiProperty({ example: 'Mechanical Keyboard' })
	public name!: string;

	/** Stock keeping unit. */
	@Expose()
	@ApiProperty({ example: 'KB-001' })
	public sku!: string;

	/** Long description. */
	@Expose()
	@ApiProperty({ example: 'Hot swappable, 75% layout', required: false })
	public description?: string;

	/** Category label. */
	@Expose()
	@ApiProperty({ example: 'peripherals', required: false })
	public category?: string;

	/** Unit price, stored as `numeric(12,2)`. */
	@Expose()
	@ApiProperty({ example: 129.99 })
	public price!: number;

	/** Units currently available. */
	@Expose()
	@ApiProperty({ example: 42 })
	public stock!: number;

	/** Whether the product may be sold. */
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
}
