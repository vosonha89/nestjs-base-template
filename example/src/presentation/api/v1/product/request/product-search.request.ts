import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';
import { BaseDeleteRequest, BaseSearchRequest } from '@common/base/base.request';

/**
 * Payload accepted by `DELETE /api/v1/product/:id`.
 * The identifier travels in the URL, so the body stays empty.
 */
export class ProductDeleteRequest extends BaseDeleteRequest {}

/**
 * Payload accepted by `POST /api/v1/product/search`.
 *
 * Filter and sort columns are restricted by `ProductService.searchableFields`
 * and `ProductService.sortableFields`.
 */
export class ProductSearchRequest extends BaseSearchRequest {}

/**
 * Payload accepted by `POST /api/v1/product/:id/adjust-stock`.
 */
export class ProductAdjustStockRequest {
	/**
	 * Signed number of units to add (positive) or remove (negative).
	 * Zero is rejected: use the update endpoint to set an absolute value.
	 */
	@ApiProperty({ description: 'Signed stock delta, must not be zero', example: -3 })
	@Type(() => Number)
	@IsInt()
	@IsNotEmpty()
	public delta!: number;
}
