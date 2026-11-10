import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseDataService } from '@common/base/base-data.service';
import { AppError, ClientError } from '@common/exception/client-error';
import { GlobalError } from '@common/exception/global-error';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { IRequestContextService } from '@common/service/request-context.service.interface';
import { ProductEntity } from '@data/entity/product.entity';
import { ProductRepository, ProductRepositorySymbol } from '@data/repository/product.repository';
import { ProductDto } from './product.dto';
import { IProductService } from './product.service.interface';

/**
 * Service symbol for DI register
 */
export const ProductServiceSymbol = Symbol('ProductService');

/**
 * Business service for the product catalogue.
 *
 * Besides the generic CRUD surface it demonstrates how to add an operation with
 * real business rules and a transaction boundary — the pattern the original
 * `cart` example was missing.
 * @extends BaseDataService
 * @implements IProductService
 */
@Injectable()
export class ProductService extends BaseDataService<ProductDto, ProductEntity, number> implements IProductService {
	/**
	 * Constructor
	 * @param requestContext - Service exposing the current request
	 * @param productRepository - Repository for product data access
	 */
	public constructor(
		@Inject(RequestContextServiceSymbol) requestContext: IRequestContextService,
		@Inject(ProductRepositorySymbol) private readonly productRepository: ProductRepository
	) {
		super(requestContext, productRepository, {
			dto: ProductDto,
			entity: ProductEntity,
			searchableFields: ['id', 'name', 'sku', 'category', 'price', 'stock', 'isActive', 'createdAt'],
			sortableFields: ['id', 'name', 'sku', 'price', 'stock', 'createdAt'],
			defaultSortField: 'id',
			defaultSortDirection: 'DESC'
		});
	}

	/**
	 * Adjusts the available stock by a signed delta.
	 * @param productId - Identifier of the product
	 * @param delta - Units to add (positive) or remove (negative)
	 * @returns The updated product
	 * @throws AppError `4002` when the delta is not a non zero integer
	 * @throws AppError `4008` when the adjustment would drive stock below zero
	 * @throws AppError `404` when the product does not exist
	 */
	public async adjustStock(productId: number, delta: number): Promise<ProductDto> {
		if (!Number.isInteger(delta) || delta === 0) {
			const message = GlobalError.TypeError('delta', 'non zero integer');
			throw new AppError(HttpStatus.BAD_REQUEST, new ClientError(String(message.code), message.msg));
		}

		const product = await this.productRepository.withLockedProduct(productId, (entity: ProductEntity) => {
			const next = entity.stock + delta;

			if (next < 0) {
				const message = GlobalError.InsufficientQuantityError(entity.stock, Math.abs(delta));
				throw new AppError(HttpStatus.BAD_REQUEST, new ClientError(String(message.code), message.msg));
			}

			entity.stock = next;
		});

		if (product === null) {
			throw this.notFound(productId);
		}

		return this.toDto(product);
	}
}
