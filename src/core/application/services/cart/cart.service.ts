import { BadRequestException, Inject, Injectable, Scope } from "@nestjs/common";
import { RequestContextServiceSymbol } from "../../../domain/common/service/requestContext.service";
import { IRequestContextService } from "../../../domain/common/service/interfaces/requestContext.service.interface";
import { CartRepository, CartRepositorySymbol } from "../../../../infrastructure/persistence/repositories/cart.repository";
import { CartItemRepository, CartItemRepositorySymbol } from "../../../../infrastructure/persistence/repositories/cart-item.repository";
import { ProductRepository, ProductRepositorySymbol } from "../../../../infrastructure/persistence/repositories/product.repository";
import { CartEntity } from "../../../../infrastructure/persistence/entities/cart.entity";
import { CartItemEntity } from "../../../../infrastructure/persistence/entities/cart-item.entity";
import { ICartService } from "../../interfaces/cart.service.interface";
import { AddToCartDto } from "../../dtos/cart.dto";
import { UpdateQuantityDto } from "../../dtos/cart.dto";
import { CartItemDto } from "../../dtos/cart.dto";
import { ObjectHelper } from "../../../domain/helpers/objectHelper";

/**
 * Symbol and interface definition for CartService
 * @namespace CartService
 */
export const CartServiceSymbol = Symbol("CartService");

/**
 * CartService class provides shopping cart functionality including adding items,
 * updating quantities, removing items, and retrieving cart contents.
 * This service implements the upsert logic for cart items.
 */
@Injectable({ scope: Scope.REQUEST })
export class CartService implements ICartService {
	constructor(
		@Inject(RequestContextServiceSymbol) private readonly requestContext: IRequestContextService,
		@Inject(CartRepositorySymbol) private readonly cartRepository: CartRepository,
		@Inject(CartItemRepositorySymbol) private readonly cartItemRepository: CartItemRepository,
		@Inject(ProductRepositorySymbol) private readonly productRepository: ProductRepository
	) { }

	/**
	 * Adds a product to the user's cart. If the product already exists in the cart,
	 * it will increment the quantity. Otherwise, it creates a new cart item.
	 * Validates product stock and availability before adding.
	 * @param userId - The ID of the user who owns the cart
	 * @param dto - Data transfer object containing productId and quantity
	 * @returns Promise resolving to the created or updated cart item
	 * @throws BadRequestException if product is unavailable or insufficient stock
	 */
	public async addToCart(userId: number, dto: AddToCartDto): Promise<CartItemDto> {
		// Fetch product to validate stock and availability
		const product = await this.productRepository.findById(dto.productId);
		if (!product) {
			throw new BadRequestException('Product not found');
		}

		// Validate product availability status
		if (!product.availabilityStatus || product.availabilityStatus !== 'In Stock') {
			throw new BadRequestException(
				`Product is not available for purchase. Current status: ${product.availabilityStatus || 'Unknown'}`
			);
		}

		// Validate stock quantity
		if (product.stock === null || product.stock === undefined) {
			throw new BadRequestException('Product stock information is unavailable');
		}

		if (product.stock < dto.quantity) {
			throw new BadRequestException(
				`Insufficient stock. Available: ${product.stock}, Requested: ${dto.quantity}`
			);
		}

		// Find or create cart for the user
		const carts = await this.cartRepository.find({
			where: { userId }
		});
		let cart = carts.length > 0 ? carts[0] : null;

		if (!cart) {
			cart = new CartEntity();
			cart.userId = userId;
			cart = await this.cartRepository.save(cart);
		}

		// Find existing cart item for this product
		const cartItems = await this.cartItemRepository.find({
			where: { cartId: cart.id, productId: dto.productId }
		});
		let cartItem = cartItems.length > 0 ? cartItems[0] : null;

		if (cartItem) {
			// Item exists, validate total quantity against stock
			const newQuantity = cartItem.quantity + dto.quantity;
			if (product.stock < newQuantity) {
				throw new BadRequestException(
					`Insufficient stock. Available: ${product.stock}, Requested total: ${newQuantity}`
				);
			}
			cartItem.quantity = newQuantity;
			cartItem = await this.cartItemRepository.save(cartItem);
		} else {
			// Item doesn't exist, create new cart item
			cartItem = new CartItemEntity();
			cartItem.cartId = cart.id;
			cartItem.productId = dto.productId;
			cartItem.quantity = dto.quantity;
			cartItem.priceAtAdd = product.price || 0;

			cartItem = await this.cartItemRepository.save(cartItem);
		}

		// Convert entity to DTO and return
		const cartItemDto = new CartItemDto();
		ObjectHelper.map(cartItem, cartItemDto);
		return cartItemDto;
	}

	/**
	 * Updates the quantity of a specific item in the user's cart.
	 * @param userId - The ID of the user who owns the cart
	 * @param cartItemId - The ID of the cart item to update
	 * @param dto - Data transfer object containing the new quantity
	 * @returns Promise resolving to the updated cart item
	 */
	public async updateQuantity(userId: number, cartItemId: number, dto: UpdateQuantityDto): Promise<CartItemDto> {
		// Verify the cart item belongs to the user
		const cartItems = await this.cartItemRepository.find({
			where: { id: cartItemId }
		});
		const cartItem = cartItems.length > 0 ? cartItems[0] : null;

		if (!cartItem) {
			throw new Error('Cart item not found');
		}

		// Verify the cart item belongs to the user by checking the cart
		const cart = await this.cartRepository.findById(cartItem.cartId);
		if (!cart || cart.userId !== userId) {
			throw new Error('Access denied: Cart item does not belong to this user');
		}

		// Update quantity
		cartItem.quantity = dto.quantity;
		const updatedCartItem = await this.cartItemRepository.save(cartItem);

		// Convert entity to DTO and return
		const cartItemDto = new CartItemDto();
		ObjectHelper.map(updatedCartItem, cartItemDto);
		return cartItemDto;
	}

	/**
	 * Removes an item from the user's cart.
	 * @param userId - The ID of the user who owns the cart
	 * @param cartItemId - The ID of the cart item to remove
	 * @returns Promise resolving to true if the item was successfully removed, false otherwise
	 */
	public async removeFromCart(userId: number, cartItemId: number): Promise<boolean> {
		// Verify the cart item belongs to the user
		const cartItems = await this.cartItemRepository.find({
			where: { id: cartItemId }
		});
		const cartItem = cartItems.length > 0 ? cartItems[0] : null;

		if (!cartItem) {
			return false;
		}

		// Verify the cart item belongs to the user by checking the cart
		const cart = await this.cartRepository.findById(cartItem.cartId);
		if (!cart || cart.userId !== userId) {
			throw new Error('Access denied: Cart item does not belong to this user');
		}

		// Remove the cart item
		await this.cartItemRepository.delete(cartItemId);
		return true;
	}

	/**
	 * Retrieves all items in the user's cart.
	 * @param userId - The ID of the user whose cart to retrieve
	 * @returns Promise resolving to an array of cart items
	 */
	public async getCart(userId: number): Promise<CartItemDto[]> {
		// Find cart for the user
		const carts = await this.cartRepository.find({
			where: { userId }
		});
		const cart = carts.length > 0 ? carts[0] : null;

		if (!cart) {
			return [];
		}

		// Find all cart items for this cart with product details
		const cartItems = await this.cartItemRepository.find({
			where: { cartId: cart.id },
			relations: ['product']
		});

		// Convert entities to DTOs
		const cartItemDtos: CartItemDto[] = cartItems.map(cartItem => {
			const cartItemDto = new CartItemDto();
			ObjectHelper.map(cartItem, cartItemDto);
			return cartItemDto;
		});

		return cartItemDtos;
	}

	/**
	 * Retrieves the current price of a product for snapshot purposes.
	 * This method is used to capture the price at the time of adding to cart.
	 * @param productId - The ID of the product to get the price for
	 * @returns Promise resolving to the current product price, or 0 if not found
	 */
	public async getProductPriceSnapshot(productId: number): Promise<number> {
		const product = await this.productRepository.findById(productId);
		if (!product) {
			return 0;
		}
		return product.price || 0;
	}
}
