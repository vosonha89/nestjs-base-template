import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PsqlEntity } from "../database/psqlEntity";
import { CartEntity } from './cart.entity';
import { ProductEntity } from './product.entity';

/**
 * Represents an item in a shopping cart.
 * Each cart item links a product to a cart with a specific quantity and price snapshot.
 */
@Entity({ name: 'cart_item', schema: 'public' })
export class CartItemEntity extends PsqlEntity<number> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @PrimaryGeneratedColumn({ type: 'bigint', transformer: { to: (value: number) => value, from: (value: string) => parseInt(value, 10) } } as any)
    id!: number;

    /**
     * Foreign key to the cart this item belongs to
     */
    @Column({ type: 'bigint', transformer: { to: (value: number) => value, from: (value: string) => parseInt(value, 10) } })
    cartId!: number;

    /**
     * Foreign key to the product this item represents
     */
    @Column({ type: 'bigint', transformer: { to: (value: number) => value, from: (value: string) => parseInt(value, 10) } })
    productId!: number;

    /**
     * Quantity of this product in the cart
     */
    @Column({ type: 'integer' })
    quantity!: number;

    /**
     * Price of the product at the time it was added to the cart (snapshot)
     */
    @Column({ type: 'float' })
    priceAtAdd!: number;

    /**
     * Reference to the cart this item belongs to
     */
    @ManyToOne(() => CartEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cartId' })
    cart!: CartEntity;

    /**
     * Reference to the product this item represents
     */
    @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product!: ProductEntity;
}
