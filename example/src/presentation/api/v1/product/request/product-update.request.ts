import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { BaseUpdateRequest } from '@common/base/base.request';

/**
 * Payload accepted by `PUT /api/v1/product/:id`.
 * Every field is optional: only the ones present are written.
 */
export class ProductUpdateRequest extends BaseUpdateRequest {
	/** Product name. */
	@ApiProperty({ description: 'Product name', required: false })
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(200)
	public name?: string;

	/** Stock keeping unit. */
	@ApiProperty({ description: 'Stock keeping unit', required: false })
	@IsOptional()
	@IsString()
	@Matches(/^[A-Za-z0-9_-]{1,64}$/, { message: 'sku may only contain letters, digits, dashes and underscores' })
	public sku?: string;

	/** Long description. */
	@ApiProperty({ description: 'Long description', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	public description?: string;

	/** Category label. */
	@ApiProperty({ description: 'Category label', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(64)
	public category?: string;

	/** Unit price, at most two decimals. */
	@ApiProperty({ description: 'Unit price', required: false })
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 }, { message: 'price must have at most 2 decimal places' })
	@Min(0, { message: 'price must be greater than or equal to 0' })
	public price?: number;

	/** Absolute stock level. Prefer the adjust-stock endpoint for deltas. */
	@ApiProperty({ description: 'Absolute stock level', required: false })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0, { message: 'stock must be greater than or equal to 0' })
	public stock?: number;

	/** Whether the product may be sold. */
	@ApiProperty({ description: 'Whether the product may be sold', required: false })
	@IsOptional()
	@IsBoolean()
	public isActive?: boolean;
}
