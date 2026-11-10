import { IBaseDataService } from '@common/base/base-data.service.interface';
import { ProductDto } from './product.dto';

/**
 * Contract for the product business service.
 * @extends IBaseDataService
 */
export interface IProductService extends IBaseDataService<ProductDto, number> {
	/**
	 * Adjusts the available stock by a signed delta.
	 *
	 * Runs inside a transaction with a row lock, so two concurrent calls can
	 * never oversell.
	 * @param productId - Identifier of the product
	 * @param delta - Units to add (positive) or remove (negative)
	 * @returns The updated product
	 */
	adjustStock(productId: number, delta: number): Promise<ProductDto>;
}
