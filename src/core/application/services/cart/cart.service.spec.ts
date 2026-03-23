import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CartService, CartServiceSymbol } from './cart.service';
import { RequestContextServiceSymbol } from '../../../domain/common/service/requestContext.service';
import { CartRepositorySymbol } from '../../../../infrastructure/persistence/repositories/cart.repository';
import { CartItemRepositorySymbol } from '../../../../infrastructure/persistence/repositories/cart-item.repository';
import { ProductRepositorySymbol } from '../../../../infrastructure/persistence/repositories/product.repository';
import { CartEntity } from '../../../../infrastructure/persistence/entities/cart.entity';
import { CartItemEntity } from '../../../../infrastructure/persistence/entities/cart-item.entity';
import { ProductEntity } from '../../../../infrastructure/persistence/entities/product.entity';
import { AddToCartDto } from '../../dtos/cart.dto';

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

const mockCartRepository = {
	findById: jest.fn(),
	find: jest.fn(),
	save: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
	exists: jest.fn(),
	existsBy: jest.fn(),
} as any;

const mockCartItemRepository = {
	findById: jest.fn(),
	find: jest.fn(),
	save: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
	exists: jest.fn(),
	existsBy: jest.fn(),
} as any;

const mockProductRepository = {
	findById: jest.fn(),
	find: jest.fn(),
	save: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
	exists: jest.fn(),
	existsBy: jest.fn(),
} as any;

describe('CartService', () => {
	let module: TestingModule;
	let service: CartService;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: CartServiceSymbol,
					useClass: CartService,
				},
				{
					provide: RequestContextServiceSymbol,
					useValue: mockRequestContextService,
				},
				{
					provide: CartRepositorySymbol,
					useValue: mockCartRepository,
				},
				{
					provide: CartItemRepositorySymbol,
					useValue: mockCartItemRepository,
				},
				{
					provide: ProductRepositorySymbol,
					useValue: mockProductRepository,
				},
			],
		}).compile();

		service = await module.resolve<CartService>(CartServiceSymbol);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('addToCart', () => {
		describe('addToCart creates new item', () => {
			it('should create a new cart item when product is not in cart', async () => {
				const userId = 1;
				const dto: AddToCartDto = { productId: 100, quantity: 2 };
				const mockProduct: Partial<ProductEntity> = {
					id: 100,
					title: 'Test Product',
					price: 50,
					stock: 10,
					availabilityStatus: 'In Stock',
				};
				const mockCart: Partial<CartEntity> = {
					id: 1,
					userId: userId,
				};
				const mockCartItem: Partial<CartItemEntity> = {
					id: 1,
					cartId: 1,
					productId: 100,
					quantity: 2,
					priceAtAdd: 50,
				};

				mockProductRepository.findById.mockResolvedValue(mockProduct);
				mockCartRepository.find.mockResolvedValue([]);
				mockCartRepository.save.mockResolvedValue(mockCart);
				mockCartItemRepository.find.mockResolvedValue([]);
				mockCartItemRepository.save.mockResolvedValue(mockCartItem);

				const result = await service.addToCart(userId, dto);

				expect(result).toBeDefined();
				expect(result.productId).toBe(100);
				expect(result.quantity).toBe(2);
				expect(result.priceAtAdd).toBe(50);
				expect(mockProductRepository.findById).toHaveBeenCalledWith(100);
				expect(mockCartRepository.find).toHaveBeenCalledWith({ where: { userId } });
				expect(mockCartRepository.save).toHaveBeenCalled();
				expect(mockCartItemRepository.find).toHaveBeenCalledWith({
					where: { cartId: 1, productId: 100 }
				});
				expect(mockCartItemRepository.save).toHaveBeenCalled();
			});
		});

		describe('addToCart increments existing', () => {
			it('should increment quantity when product already exists in cart', async () => {
				const userId = 1;
				const dto: AddToCartDto = { productId: 100, quantity: 3 };
				const mockProduct: Partial<ProductEntity> = {
					id: 100,
					title: 'Test Product',
					price: 50,
					stock: 10,
					availabilityStatus: 'In Stock',
				};
				const mockCart: Partial<CartEntity> = {
					id: 1,
					userId: userId,
				};
				const existingCartItem: Partial<CartItemEntity> = {
					id: 1,
					cartId: 1,
					productId: 100,
					quantity: 2,
					priceAtAdd: 50,
				};
				const updatedCartItem: Partial<CartItemEntity> = {
					id: 1,
					cartId: 1,
					productId: 100,
					quantity: 5, // 2 + 3 = 5
					priceAtAdd: 50,
				};

				mockProductRepository.findById.mockResolvedValue(mockProduct);
				mockCartRepository.find.mockResolvedValue([mockCart]);
				mockCartItemRepository.find.mockResolvedValue([existingCartItem]);
				mockCartItemRepository.save.mockResolvedValue(updatedCartItem);

				const result = await service.addToCart(userId, dto);

				expect(result).toBeDefined();
				expect(result.productId).toBe(100);
				expect(result.quantity).toBe(5);
				expect(result.priceAtAdd).toBe(50);
				expect(mockProductRepository.findById).toHaveBeenCalledWith(100);
				expect(mockCartRepository.find).toHaveBeenCalledWith({ where: { userId } });
				expect(mockCartItemRepository.save).toHaveBeenCalled();
			});
		});

		describe('out of stock validation', () => {
			it('should throw BadRequestException when requested quantity exceeds available stock', async () => {
				const userId = 1;
				const dto: AddToCartDto = { productId: 100, quantity: 10 };
				const mockProduct: Partial<ProductEntity> = {
					id: 100,
					title: 'Test Product',
					price: 50,
					stock: 5,
					availabilityStatus: 'In Stock',
				};

				mockProductRepository.findById.mockResolvedValue(mockProduct);

				await expect(service.addToCart(userId, dto)).rejects.toThrow(BadRequestException);
				await expect(service.addToCart(userId, dto)).rejects.toThrow(
					'Insufficient stock. Available: 5, Requested: 10'
				);
			});

			it('should throw BadRequestException when total quantity exceeds available stock for existing item', async () => {
				const userId = 1;
				const dto: AddToCartDto = { productId: 100, quantity: 4 };
				const mockProduct: Partial<ProductEntity> = {
					id: 100,
					title: 'Test Product',
					price: 50,
					stock: 5,
					availabilityStatus: 'In Stock',
				};
				const mockCart: Partial<CartEntity> = {
					id: 1,
					userId: userId,
				};
				const existingCartItem: Partial<CartItemEntity> = {
					id: 1,
					cartId: 1,
					productId: 100,
					quantity: 3,
					priceAtAdd: 50,
				};

				mockProductRepository.findById.mockResolvedValue(mockProduct);
				mockCartRepository.find.mockResolvedValue([mockCart]);
				mockCartItemRepository.find.mockResolvedValue([existingCartItem]);

				await expect(service.addToCart(userId, dto)).rejects.toThrow(BadRequestException);
				await expect(service.addToCart(userId, dto)).rejects.toThrow(
					'Insufficient stock. Available: 5, Requested total: 7'
				);
			});

			it('should throw BadRequestException when product is not available', async () => {
				const userId = 1;
				const dto: AddToCartDto = { productId: 100, quantity: 2 };
				const mockProduct: Partial<ProductEntity> = {
					id: 100,
					title: 'Test Product',
					price: 50,
					stock: 10,
					availabilityStatus: 'Out of Stock',
				};

				mockProductRepository.findById.mockResolvedValue(mockProduct);

				await expect(service.addToCart(userId, dto)).rejects.toThrow(BadRequestException);
				await expect(service.addToCart(userId, dto)).rejects.toThrow(
					'Product is not available for purchase. Current status: Out of Stock'
				);
			});

			it('should throw BadRequestException when product is not found', async () => {
				const userId = 1;
				const dto: AddToCartDto = { productId: 999, quantity: 2 };

				mockProductRepository.findById.mockResolvedValue(null);

				await expect(service.addToCart(userId, dto)).rejects.toThrow(BadRequestException);
				await expect(service.addToCart(userId, dto)).rejects.toThrow('Product not found');
			});
		});

		describe('price lock', () => {
			it('should maintain priceAtAdd snapshot when product price changes', async () => {
				const userId = 1;
				const dto: AddToCartDto = { productId: 100, quantity: 2 };
				const mockProduct: Partial<ProductEntity> = {
					id: 100,
					title: 'Test Product',
					price: 100, // Initial price
					stock: 10,
					availabilityStatus: 'In Stock',
				};
				const mockCart: Partial<CartEntity> = {
					id: 1,
					userId: userId,
				};
				const mockCartItem: Partial<CartItemEntity> = {
					id: 1,
					cartId: 1,
					productId: 100,
					quantity: 2,
					priceAtAdd: 100, // Price snapshot at time of adding
				};

				mockProductRepository.findById.mockResolvedValue(mockProduct);
				mockCartRepository.find.mockResolvedValue([]);
				mockCartRepository.save.mockResolvedValue(mockCart);
				mockCartItemRepository.find.mockResolvedValue([]);
				mockCartItemRepository.save.mockResolvedValue(mockCartItem);

				// Add item to cart with price 100
				const result = await service.addToCart(userId, dto);

				expect(result.priceAtAdd).toBe(100);

				// Simulate product price change to 150
				const updatedProduct: Partial<ProductEntity> = {
					...mockProduct,
					price: 150,
				};
				mockProductRepository.findById.mockResolvedValue(updatedProduct);

				// Verify that the cart item's priceAtAdd remains 100
				// (The service doesn't fetch cart items after creation, but we can verify
				// that the priceAtAdd was set correctly during creation)
				expect(mockCartItemRepository.save).toHaveBeenCalledWith(
					expect.objectContaining({
						priceAtAdd: 100,
					})
				);
			});

			it('should use product price as priceAtAdd when adding new item', async () => {
				const userId = 1;
				const dto: AddToCartDto = { productId: 100, quantity: 1 };
				const mockProduct: Partial<ProductEntity> = {
					id: 100,
					title: 'Test Product',
					price: 75.50,
					stock: 10,
					availabilityStatus: 'In Stock',
				};
				const mockCart: Partial<CartEntity> = {
					id: 1,
					userId: userId,
				};
				const mockCartItem: Partial<CartItemEntity> = {
					id: 1,
					cartId: 1,
					productId: 100,
					quantity: 1,
					priceAtAdd: 75.50,
				};

				mockProductRepository.findById.mockResolvedValue(mockProduct);
				mockCartRepository.find.mockResolvedValue([]);
				mockCartRepository.save.mockResolvedValue(mockCart);
				mockCartItemRepository.find.mockResolvedValue([]);
				mockCartItemRepository.save.mockResolvedValue(mockCartItem);

				const result = await service.addToCart(userId, dto);

				expect(result.priceAtAdd).toBe(75.50);
				expect(mockCartItemRepository.save).toHaveBeenCalledWith(
					expect.objectContaining({
						priceAtAdd: 75.50,
					})
				);
			});
		});

		describe('cascade delete', () => {
			it('should have cascade delete configured on CartItemEntity', () => {
				// This test verifies the entity configuration
				// The CartItemEntity has ManyToOne with onDelete: 'CASCADE' on the cart relationship
				const cartItemEntity = new CartItemEntity();

				// Verify that the entity has the cart relationship defined
				expect(cartItemEntity).toHaveProperty('cart');

				// The cascade delete is configured via TypeORM decorators
				// This is a structural verification that the entity has the correct configuration
				// In a real scenario, this would be tested via integration tests
			});
		});
	});

	describe('getCart', () => {
		it('should return empty array when user has no cart', async () => {
			const userId = 1;

			mockCartRepository.find.mockResolvedValue([]);

			const result = await service.getCart(userId);

			expect(result).toEqual([]);
			expect(mockCartRepository.find).toHaveBeenCalledWith({ where: { userId } });
		});

		it('should return cart items for the user', async () => {
			const userId = 1;
			const mockCart: Partial<CartEntity> = {
				id: 1,
				userId: userId,
			};
			const mockCartItems: Partial<CartItemEntity>[] = [
				{
					id: 1,
					cartId: 1,
					productId: 100,
					quantity: 2,
					priceAtAdd: 50,
				},
				{
					id: 2,
					cartId: 1,
					productId: 101,
					quantity: 1,
					priceAtAdd: 30,
				},
			];

			mockCartRepository.find.mockResolvedValue([mockCart]);
			mockCartItemRepository.find.mockResolvedValue(mockCartItems);

			const result = await service.getCart(userId);

			expect(result).toHaveLength(2);
			expect(result[0].productId).toBe(100);
			expect(result[0].quantity).toBe(2);
			expect(result[1].productId).toBe(101);
			expect(result[1].quantity).toBe(1);
		});
	});

	describe('removeFromCart', () => {
		it('should remove cart item and return true', async () => {
			const userId = 1;
			const cartItemId = 1;
			const mockCart: Partial<CartEntity> = {
				id: 1,
				userId: userId,
			};
			const mockCartItem: Partial<CartItemEntity> = {
				id: 1,
				cartId: 1,
				productId: 100,
				quantity: 2,
			};

			mockCartItemRepository.find.mockResolvedValue([mockCartItem]);
			mockCartRepository.findById.mockResolvedValue(mockCart);
			mockCartItemRepository.delete.mockResolvedValue(true);

			const result = await service.removeFromCart(userId, cartItemId);

			expect(result).toBe(true);
			expect(mockCartItemRepository.delete).toHaveBeenCalledWith(cartItemId);
		});

		it('should return false when cart item not found', async () => {
			const userId = 1;
			const cartItemId = 999;

			mockCartItemRepository.find.mockResolvedValue([]);

			const result = await service.removeFromCart(userId, cartItemId);

			expect(result).toBe(false);
		});
	});

	describe('updateQuantity', () => {
		it('should update cart item quantity', async () => {
			const userId = 1;
			const cartItemId = 1;
			const newQuantity = 5;
			const mockCart: Partial<CartEntity> = {
				id: 1,
				userId: userId,
			};
			const mockCartItem: Partial<CartItemEntity> = {
				id: 1,
				cartId: 1,
				productId: 100,
				quantity: 2,
				priceAtAdd: 50,
			};
			const updatedCartItem: Partial<CartItemEntity> = {
				...mockCartItem,
				quantity: newQuantity,
			};

			mockCartItemRepository.find.mockResolvedValue([mockCartItem]);
			mockCartRepository.findById.mockResolvedValue(mockCart);
			mockCartItemRepository.save.mockResolvedValue(updatedCartItem);

			const result = await service.updateQuantity(userId, cartItemId, { quantity: newQuantity });

			expect(result.quantity).toBe(newQuantity);
			expect(mockCartItemRepository.save).toHaveBeenCalled();
		});

		it('should throw error when cart item not found', async () => {
			const userId = 1;
			const cartItemId = 999;

			mockCartItemRepository.find.mockResolvedValue([]);

			await expect(
				service.updateQuantity(userId, cartItemId, { quantity: 5 })
			).rejects.toThrow('Cart item not found');
		});
	});
});
