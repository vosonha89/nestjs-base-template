import { Inject, Injectable, Scope } from "@nestjs/common";
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
	 * @param userId - The ID of the user who owns the cart
	 * @param dto - Data transfer object containing productId and quantity
	 * @returns Promise resolving to the created or updated cart item
	 */
	public async addToCart(userId: number, dto: AddToCartDto): Promise<CartItemDto> {
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
			// Item exists, increment quantity
			cartItem.quantity += dto.quantity;
			cartItem = await this.cartItemRepository.save(cartItem);
		} else {
			// Item doesn't exist, create new cart item
			const product = await this.productRepository.findById(dto.productId);
			if (!product) {
				throw new Error('Product not found');
			}

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
}
