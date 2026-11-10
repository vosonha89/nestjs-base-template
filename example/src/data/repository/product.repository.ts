import { Inject, Injectable } from '@nestjs/common';
import { PsqlContext, PsqlContextSymbol } from '../context/psql.context';
import { ProductEntity } from '../entity/product.entity';
import { PsqlRepository } from './psql.repository';

/**
 * Service symbol for DI register
 */
export const ProductRepositorySymbol = Symbol('ProductRepository');

/**
 * Data access for {@link ProductEntity}.
 * @extends PsqlRepository
 */
@Injectable()
export class ProductRepository extends PsqlRepository<ProductEntity, number> {
	/**
	 * Constructor
	 * @param psqlContext - Persistence context owning the connection pool
	 */
	public constructor(@Inject(PsqlContextSymbol) psqlContext: PsqlContext) {
		super(psqlContext, ProductEntity);
	}

	/**
	 * Locks a product row, lets the caller mutate it, and persists the change
	 * inside a single transaction.
	 *
	 * `SELECT ... FOR UPDATE` serialises concurrent adjustments, which is what
	 * prevents the oversell race the original cart example had (read, validate,
	 * write with no lock and no transaction).
	 * @param productId - Identifier of the product to lock
	 * @param mutate - Callback that applies the change; throwing rolls back
	 * @returns The persisted product, or `null` when it does not exist
	 */
	public async withLockedProduct(
		productId: number,
		mutate: (product: ProductEntity) => void
	): Promise<ProductEntity | null> {
		return this.repository.manager.transaction(async (manager) => {
			const repo = manager.getRepository(ProductEntity);

			const product = await repo
				.createQueryBuilder('product')
				.setLock('pessimistic_write')
				.where('product.id = :productId', { productId })
				.andWhere('product.deletedAt IS NULL')
				.getOne();

			if (product === null) {
				return null;
			}

			mutate(product);

			return repo.save(product);
		});
	}
}
