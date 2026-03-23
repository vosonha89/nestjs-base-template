import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import { PsqlEntity } from "../database/psqlEntity";
import { CartItemEntity } from './cart-item.entity';

/**
 * Represents a shopping cart entity in the database.
 * Each cart belongs to a single user and contains multiple cart items.
 */
@Entity({ name: 'cart', schema: 'public' })
export class CartEntity extends PsqlEntity<number> {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id!: number;

    /**
     * Foreign key to the user who owns this cart
     */
    @Column({ type: 'bigint' })
    userId!: number;

    /**
     * Collection of items in this cart
     */
    @OneToMany(() => CartItemEntity, (item: CartItemEntity) => item.cart, { cascade: true })
    @JoinColumn({ name: 'cartId' })
    items!: CartItemEntity[];
}
