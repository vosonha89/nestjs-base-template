import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { PsqlEntity } from "../database/psqlEntity";

/**
 * Represents a product entity in the database.
 * Contains all product information including pricing, inventory, and metadata.
 */
@Entity({ name: 'product', schema: 'public' })
export class ProductEntity extends PsqlEntity<number> {
    /**
     * Unique identifier for the product
     */
    @PrimaryGeneratedColumn({ type: 'bigint', transformer: { to: (value: number) => value, from: (value: string) => parseInt(value, 10) } } as any)
    id!: number;

    /**
     * Product title
     */
    @Column({ type: 'text', nullable: true })
    title?: string;

    /**
     * Product description
     */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /**
     * Product category
     */
    @Column({ type: 'text', nullable: true })
    category?: string;

    /**
     * Product price
     */
    @Column({ type: 'float', nullable: true })
    price?: number;

    /**
     * Discount percentage applied to the product
     */
    @Column({ name: 'discountPercentage', type: 'float', nullable: true })
    discountPercentage?: number;

    /**
     * Product rating
     */
    @Column({ type: 'float', nullable: true })
    rating?: number;

    /**
     * Available stock quantity
     */
    @Column({ type: 'integer', nullable: true })
    stock?: number;

    /**
     * Product tags as JSON array
     */
    @Column({ type: 'json', nullable: true })
    tags?: string[];

    /**
     * Product brand
     */
    @Column({ type: 'text', nullable: true })
    brand?: string;

    /**
     * Product SKU (Stock Keeping Unit)
     */
    @Column({ type: 'text', nullable: true })
    sku?: string;

    /**
     * Product weight
     */
    @Column({ type: 'integer', nullable: true })
    weight?: number;

    /**
     * Product width dimension
     */
    @Column({ name: 'dimensions.width', type: 'float', nullable: true })
    dimensionsWidth?: number;

    /**
     * Product height dimension
     */
    @Column({ name: 'dimensions.height', type: 'float', nullable: true })
    dimensionsHeight?: number;

    /**
     * Product depth dimension
     */
    @Column({ name: 'dimensions.depth', type: 'float', nullable: true })
    dimensionsDepth?: number;

    /**
     * Warranty information
     */
    @Column({ name: 'warrantyInformation', type: 'text', nullable: true })
    warrantyInformation?: string;

    /**
     * Shipping information
     */
    @Column({ name: 'shippingInformation', type: 'text', nullable: true })
    shippingInformation?: string;

    /**
     * Product availability status
     */
    @Column({ name: 'availabilityStatus', type: 'text', nullable: true })
    availabilityStatus?: string;

    /**
     * Product reviews as JSON array
     */
    @Column({ type: 'json', nullable: true })
    reviews?: { rating: number; comment: string; date: string; reviewerName: string }[];

    /**
     * Return policy information
     */
    @Column({ name: 'returnPolicy', type: 'text', nullable: true })
    returnPolicy?: string;

    /**
     * Minimum order quantity
     */
    @Column({ name: 'minimumOrderQuantity', type: 'integer', nullable: true })
    minimumOrderQuantity?: number;

    /**
     * Product creation date
     */
    @Column({ name: 'meta.createdAt', type: 'text', nullable: true })
    metaCreatedAt?: string;

    /**
     * Product last update date
     */
    @Column({ name: 'meta.updatedAt', type: 'text', nullable: true })
    metaUpdatedAt?: string;

    /**
     * Product barcode
     */
    @Column({ name: 'meta.barcode', type: 'text', nullable: true })
    metaBarcode?: string;

    /**
     * Product QR code
     */
    @Column({ name: 'meta.qrCode', type: 'text', nullable: true })
    metaQrCode?: string;

    /**
     * Product images as JSON array of URLs
     */
    @Column({ type: 'json', nullable: true })
    images?: string[];

    /**
     * Product thumbnail URL
     */
    @Column({ type: 'text', nullable: true })
    thumbnail?: string;
}
