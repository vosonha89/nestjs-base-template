import { AddToCartDto } from "../dtos/cart.dto";
import { UpdateQuantityDto } from "../dtos/cart.dto";
import { CartItemDto } from "../dtos/cart.dto";

/**
 * Interface defining the contract for CartService operations.
 * This interface specifies the methods required for managing shopping cart functionality.
 */
export interface ICartService {
    /**
     * Adds a product to the user's cart. If the product already exists in the cart,
     * it will increment the quantity. Otherwise, it creates a new cart item.
     * @param userId The ID of the user who owns the cart
     * @param dto Data transfer object containing productId and quantity
     * @returns Promise resolving to the created or updated cart item
     */
    addToCart(userId: number, dto: AddToCartDto): Promise<CartItemDto>;

    /**
     * Updates the quantity of a specific item in the user's cart.
     * @param userId The ID of the user who owns the cart
     * @param cartItemId The ID of the cart item to update
     * @param dto Data transfer object containing the new quantity
     * @returns Promise resolving to the updated cart item
     */
    updateQuantity(userId: number, cartItemId: number, dto: UpdateQuantityDto): Promise<CartItemDto>;

    /**
     * Removes an item from the user's cart.
     * @param userId The ID of the user who owns the cart
     * @param cartItemId The ID of the cart item to remove
     * @returns Promise resolving to true if the item was successfully removed, false otherwise
     */
    removeFromCart(userId: number, cartItemId: number): Promise<boolean>;

    /**
     * Retrieves all items in the user's cart.
     * @param userId The ID of the user whose cart to retrieve
     * @returns Promise resolving to an array of cart items
     */
    getCart(userId: number): Promise<CartItemDto[]>;
}
