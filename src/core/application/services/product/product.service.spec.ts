import { Test, TestingModule } from '@nestjs/testing';
import { ProductService, ProductServiceSymbol } from './product.service';
import { RequestContextServiceSymbol } from '../../../domain/common/service/requestContext.service';
import { ProductRepositorySymbol } from '../../../../infrastructure/persistence/repositories/product.repository';
import { ProductDto } from '../../dtos/product.dto';
import { BaseFilterWhere } from '../../../domain/common/base/base.request';
import { Equal } from 'typeorm'; // Import Equal from typeorm

const mockProductRepository = {
	findById: jest.fn(),
	find: jest.fn(),
	save: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
	exists: jest.fn(),
	existsBy: jest.fn(),
} as any;

const mockRequestContextService = {
	getContext: jest.fn(),
	setContext: jest.fn(),
	setRequest: jest.fn(),
	getRequest: jest.fn(),
	setResponse: jest.fn(),
	getResponse: jest.fn(),
	set: jest.fn(),
	get: jest.fn(),
	clear: jest.fn(),
} as any;

describe('ProductService', () => {
	let module: TestingModule;
	let service: ProductService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: ProductServiceSymbol,
					useClass: ProductService,
				},
				{
					provide: RequestContextServiceSymbol,
					useValue: mockRequestContextService,
				},
				{
					provide: ProductRepositorySymbol,
					useValue: mockProductRepository,
				},
			],
		}).compile();

		service = await module.resolve<ProductService>(ProductServiceSymbol);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findById', () => {
		it('should return a product if found', async () => {
			const productDto: ProductDto = { id: 1, title: 'Test Product', price: 10 };
			mockProductRepository.findById.mockResolvedValue(productDto);

			const result = await service.findById(1);
			expect(result).toEqual(productDto);
			expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
		});

		it('should return undefined if product not found', async () => {
			mockProductRepository.findById.mockResolvedValue(undefined);

			const result = await service.findById(99);
			expect(result).toBeUndefined();
			expect(mockProductRepository.findById).toHaveBeenCalledWith(99);
		});
	});

	describe('create', () => {
		it('should create and return a product', async () => {
			const newProduct: Partial<ProductDto> = { title: 'New Product', price: 20 };
			const createdProduct: ProductDto = { id: 2, ...newProduct } as ProductDto;
			mockProductRepository.save.mockResolvedValue(createdProduct);

			const result = await service.create(newProduct);
			expect(result).toEqual(expect.objectContaining(newProduct));
			expect(mockProductRepository.save).toHaveBeenCalledWith(newProduct);
		});
	});

	describe('update', () => {
		it('should update and return a product', async () => {
			const existingProduct: ProductDto = { id: 1, title: 'Test Product', price: 10 };
			const updatedProduct: ProductDto = { id: 1, title: 'Updated Product', price: 15 };
			mockProductRepository.findById.mockResolvedValue(existingProduct);
			mockProductRepository.update.mockResolvedValue(updatedProduct);

			const result = await service.update(1, { title: 'Updated Product', price: 15 });
			expect(result).toEqual(expect.objectContaining({ title: 'Updated Product', price: 15 }));
			expect(mockProductRepository.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Product', price: 15 }));
		});
	});

	describe('delete', () => {
		it('should delete a product and return true', async () => {
			mockProductRepository.findById.mockResolvedValue({ id: 1, createdAt: new Date(), updatedAt: new Date() } as ProductDto);
			mockProductRepository.delete.mockResolvedValue(true);

			const result = await service.delete(1);
			expect(result).toBe(true);
			expect(mockProductRepository.delete).toHaveBeenCalledWith(1);
		});

		it('should return false if product not found for deletion', async () => {
			mockProductRepository.findById.mockResolvedValue(undefined);
			mockProductRepository.delete.mockResolvedValue(false);

			const result = await service.delete(99);
			expect(result).toBe(false);
			expect(mockProductRepository.findById).toHaveBeenCalledWith(99);
		});
	});

	describe('exists', () => {
		it('should return true if product exists', async () => {
			mockProductRepository.findById.mockResolvedValue({ id: 1, createdAt: new Date(), updatedAt: new Date() } as ProductDto);
			mockProductRepository.exists.mockResolvedValue(true);

			const result = await service.exists(1);
			expect(result).toBe(true);
			expect(mockProductRepository.exists).toHaveBeenCalledWith(1);
		});

		it('should return false if product does not exist', async () => {
			mockProductRepository.findById.mockResolvedValue(undefined);
			mockProductRepository.exists.mockResolvedValue(false);

			const result = await service.exists(99);
			expect(result).toBe(false);
			expect(mockProductRepository.findById).toHaveBeenCalledWith(99);
		});
	});

	describe('existsBy', () => {
		it('should return true if product exists by conditions', async () => {
			const filters: BaseFilterWhere[] = [{ fieldName: 'title', fieldValue: 'Test Product' }];
			mockProductRepository.existsBy.mockResolvedValue(true);
			const expectedRepositoryCall = { title: Equal('Test Product') };

			const result = await service.existsBy(filters);
			expect(result).toBe(true);
			expect(mockProductRepository.existsBy).toHaveBeenCalledWith(expectedRepositoryCall);
		});

		it('should return false if product does not exist by conditions', async () => {
			const filters: BaseFilterWhere[] = [{ fieldName: 'title', fieldValue: 'Nonexistent Product' }];
			mockProductRepository.existsBy.mockResolvedValue(false);
			const expectedRepositoryCall = { title: Equal('Nonexistent Product') };

			const result = await service.existsBy(filters);
			expect(result).toBe(false);
			expect(mockProductRepository.existsBy).toHaveBeenCalledWith(expectedRepositoryCall);
		});
	});

	// Add tests for findBy when appropriate
});
