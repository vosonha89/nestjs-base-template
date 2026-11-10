import { Test } from '@nestjs/testing';
import { createRequestContextMock } from '@test/support/test-doubles';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { ProductEntity } from '@data/entity/product.entity';
import { ProductRepository, ProductRepositorySymbol } from '@data/repository/product.repository';
import { ProductService } from './product.service';

/**
 * Builds a product entity fixture.
 * @param overrides - Fields to replace
 * @returns The fixture
 */
function createProductEntity(overrides: Partial<ProductEntity> = {}): ProductEntity {
	return Object.assign(new ProductEntity(), {
		id: 1,
		name: 'Mechanical Keyboard',
		sku: 'KB-001',
		category: 'peripherals',
		price: 129.99,
		stock: 42,
		isActive: true,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		...overrides
	});
}

describe('ProductService', () => {
	let service: ProductService;
	let productRepository: jest.Mocked<
		Pick<
			ProductRepository,
			| 'withLockedProduct'
			| 'findById'
			| 'findOne'
			| 'find'
			| 'count'
			| 'save'
			| 'update'
			| 'delete'
			| 'exists'
			| 'existsBy'
		>
	>;
	let loggingService: jest.Mocked<ILoggingService>;

	beforeEach(async () => {
		productRepository = {
			withLockedProduct: jest.fn(),
			findById: jest.fn(),
			findOne: jest.fn(),
			find: jest.fn(),
			count: jest.fn(),
			save: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			exists: jest.fn(),
			existsBy: jest.fn()
		};

		loggingService = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn()
		};

		const moduleRef = await Test.createTestingModule({
			providers: [
				ProductService,
				{ provide: RequestContextServiceSymbol, useValue: createRequestContextMock() },
				{ provide: ProductRepositorySymbol, useValue: productRepository },
				{ provide: LoggingServiceSymbol, useValue: loggingService }
			]
		}).compile();

		service = moduleRef.get(ProductService);
	});

	describe('adjustStock', () => {
		it('should apply a positive delta inside the locked transaction', async () => {
			productRepository.withLockedProduct.mockImplementation(async (_id, mutate) => {
				const entity = createProductEntity();
				mutate(entity);
				return entity;
			});

			const result = await service.adjustStock(1, 8);

			expect(productRepository.withLockedProduct).toHaveBeenCalledWith(1, expect.any(Function));
			expect(result.stock).toEqual(50);
		});

		it('should apply a negative delta that stays non negative', async () => {
			productRepository.withLockedProduct.mockImplementation(async (_id, mutate) => {
				const entity = createProductEntity({ stock: 42 });
				mutate(entity);
				return entity;
			});

			await expect(service.adjustStock(1, -42)).resolves.toMatchObject({ stock: 0 });
		});

		it('should reject with 4008 when the stock would go below zero', async () => {
			productRepository.withLockedProduct.mockImplementation(async (_id, mutate) => {
				const entity = createProductEntity({ stock: 0 });
				mutate(entity);
				return entity;
			});

			await expect(service.adjustStock(1, -1)).rejects.toMatchObject({
				httpStatus: 400,
				exception: { errorCode: '4008' }
			});
		});

		it('should reject a zero delta with 4002', async () => {
			await expect(service.adjustStock(1, 0)).rejects.toMatchObject({ exception: { errorCode: '4002' } });
			expect(productRepository.withLockedProduct).not.toHaveBeenCalled();
		});

		it('should reject a non integer delta with 4002', async () => {
			await expect(service.adjustStock(1, 1.5)).rejects.toMatchObject({ exception: { errorCode: '4002' } });
		});

		it('should surface a 404 when the product does not exist', async () => {
			productRepository.withLockedProduct.mockResolvedValue(null);

			await expect(service.adjustStock(999, 1)).rejects.toMatchObject({
				httpStatus: 404,
				exception: { errorCode: '404' }
			});
		});
	});
});
