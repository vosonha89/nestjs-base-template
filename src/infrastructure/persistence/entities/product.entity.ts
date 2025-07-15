import {Entity, Column} from 'typeorm';
import {PsqlEntity} from "../database/psqlEntity";

@Entity({name: 'product', schema: 'public'})
export class ProductEntity extends PsqlEntity<number> {
    @Column({type: 'text', nullable: true})
    title?: string;

    @Column({type: 'text', nullable: true})
    description?: string;

    @Column({type: 'text', nullable: true})
    category?: string;

    @Column({type: 'float', nullable: true})
    price?: number;

    @Column({name: 'discountPercentage', type: 'float', nullable: true})
    discountPercentage?: number;

    @Column({type: 'float', nullable: true})
    rating?: number;

    @Column({type: 'integer', nullable: true})
    stock?: number;

    @Column({type: 'json', nullable: true})
    tags?: any;

    @Column({type: 'text', nullable: true})
    brand?: string;

    @Column({type: 'text', nullable: true})
    sku?: string;

    @Column({type: 'integer', nullable: true})
    weight?: number;

    @Column({name: 'dimensions.width', type: 'float', nullable: true})
    dimensionsWidth?: number;

    @Column({name: 'dimensions.height', type: 'float', nullable: true})
    dimensionsHeight?: number;

    @Column({name: 'dimensions.depth', type: 'float', nullable: true})
    dimensionsDepth?: number;

    @Column({name: 'warrantyInformation', type: 'text', nullable: true})
    warrantyInformation?: string;

    @Column({name: 'shippingInformation', type: 'text', nullable: true})
    shippingInformation?: string;

    @Column({name: 'availabilityStatus', type: 'text', nullable: true})
    availabilityStatus?: string;

    @Column({type: 'json', nullable: true})
    reviews?: any;

    @Column({name: 'returnPolicy', type: 'text', nullable: true})
    returnPolicy?: string;

    @Column({name: 'minimumOrderQuantity', type: 'integer', nullable: true})
    minimumOrderQuantity?: number;

    @Column({name: 'meta.createdAt', type: 'text', nullable: true})
    metaCreatedAt?: string;

    @Column({name: 'meta.updatedAt', type: 'text', nullable: true})
    metaUpdatedAt?: string;

    @Column({name: 'meta.barcode', type: 'text', nullable: true})
    metaBarcode?: string;

    @Column({name: 'meta.qrCode', type: 'text', nullable: true})
    metaQrCode?: string;

    @Column({type: 'json', nullable: true})
    images?: any;

    @Column({type: 'text', nullable: true})
    thumbnail?: string;
}
