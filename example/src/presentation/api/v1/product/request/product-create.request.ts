import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	Min,
	MinLength
} from 'class-validator';
import { BaseCreateRequest } from '@common/base/base.request';

/**
 * Payload accepted by `POST /api/v1/product`.
 */
export class ProductCreateRequest extends BaseCreateRequest {
	/** Product name. */
	@ApiProperty({ description: 'Product name', example: 'Mechanical Keyboard' })
	@IsNotEmpty({ message: 'name is required' })
	@IsString()
	@MinLength(1)
	@MaxLength(200)
	public name!: string;

	/** Stock keeping unit, unique across the catalogue. */
	@ApiProperty({ description: 'Stock keeping unit', example: 'KB-001' })
	@IsNotEmpty({ message: 'sku is required' })
	@IsString()
	@Matches(/^[A-Za-z0-9_-]{1,64}$/, { message: 'sku may only contain letters, digits, dashes and underscores' })
	public sku!: string;

	/** Long description. */
	@ApiProperty({ description: 'Long description', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	public description?: string;

	/** Category label. */
	@ApiProperty({ description: 'Category label', required: false, example: 'peripherals' })
	@IsOptional()
	@IsString()
	@MaxLength(64)
	public category?: string;

	/** Unit price, at most two decimals. */
	@ApiProperty({ description: 'Unit price', example: 129.99 })
	@IsNotEmpty({ message: 'price is required' })
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 }, { message: 'price must have at most 2 decimal places' })
	@Min(0, { message: 'price must be greater than or equal to 0' })
	public price!: number;

	/** Initial stock. */
	@ApiProperty({ description: 'Initial stock', example: 42 })
	@IsNotEmpty({ message: 'stock is required' })
	@Type(() => Number)
	@IsInt()
	@Min(0, { message: 'stock must be greater than or equal to 0' })
	public stock!: number;

	/** Whether the product may be sold. */
	@ApiProperty({ description: 'Whether the product may be sold', required: false, default: true })
	@IsOptional()
	@IsBoolean()
	public isActive?: boolean;
}
