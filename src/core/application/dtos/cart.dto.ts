import { BaseType } from "../../domain/common/base/base.type";

/**
 * Data Transfer Object for adding a product to a cart
 */
export class AddToCartDto {
    /**
     * The ID of the product to add to the cart
     */
    productId!: number;

    /**
     * The quantity of the product to add
     */
    quantity!: number;
}

/**
 * Data Transfer Object for updating the quantity of a cart item
 */
export class UpdateQuantityDto {
    /**
     * The new quantity for the cart item
     */
    quantity!: number;
}

/**
 * Response DTO for cart item data that matches the structure of CartItemEntity
 */
export class CartItemDto extends BaseType<number> {
    id!: number;

    /**
     * Foreign key to the cart this item belongs to
     */
    cartId!: number;

    /**
     * Foreign key to the product this item represents
     */
    productId!: number;

    /**
     * Quantity of this product in the cart
     */
    quantity!: number;

    /**
     * Price of the product at the time it was added to the cart (snapshot)
     */
    priceAtAdd!: number;
}
