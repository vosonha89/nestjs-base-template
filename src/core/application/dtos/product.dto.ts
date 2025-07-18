import { BaseType } from "../../domain/common/base/base.type";

/**
 * Response DTO for product data that matches the structure of ProductEntity
 */
export class ProductDto extends BaseType<number> {
	id!: number;
    title?: string;
    description?: string;
    category?: string;
    price?: number;
    discountPercentage?: number;
    rating?: number;
    stock?: number;
    tags?: any;
    brand?: string;
    sku?: string;
    weight?: number;
    dimensionsWidth?: number;
    dimensionsHeight?: number;
    dimensionsDepth?: number;
    warrantyInformation?: string;
    shippingInformation?: string;
    availabilityStatus?: string;
    reviews?: any;
    returnPolicy?: string;
    minimumOrderQuantity?: number;
    metaCreatedAt?: string;
    metaUpdatedAt?: string;
    metaBarcode?: string;
    metaQrCode?: string;
    images?: any;
    thumbnail?: string;

    /**
     * Factory method to create a ProductResponseDto from a ProductEntity
     * @param entity The product entity to transform
     * @returns A new ProductResponseDto instance
     */
    static fromEntity(entity: any): ProductDto {
        const response = new ProductDto();
        response.id = entity.id;
        response.title = entity.title;
        response.description = entity.description;
        response.category = entity.category;
        response.price = entity.price;
        response.discountPercentage = entity.discountPercentage;
        response.rating = entity.rating;
        response.stock = entity.stock;
        response.tags = entity.tags;
        response.brand = entity.brand;
        response.sku = entity.sku;
        response.weight = entity.weight;
        response.dimensionsWidth = entity.dimensionsWidth;
        response.dimensionsHeight = entity.dimensionsHeight;
        response.dimensionsDepth = entity.dimensionsDepth;
        response.warrantyInformation = entity.warrantyInformation;
        response.shippingInformation = entity.shippingInformation;
        response.availabilityStatus = entity.availabilityStatus;
        response.reviews = entity.reviews;
        response.returnPolicy = entity.returnPolicy;
        response.minimumOrderQuantity = entity.minimumOrderQuantity;
        response.metaCreatedAt = entity.metaCreatedAt;
        response.metaUpdatedAt = entity.metaUpdatedAt;
        response.metaBarcode = entity.metaBarcode;
        response.metaQrCode = entity.metaQrCode;
        response.images = entity.images;
        response.thumbnail = entity.thumbnail;

        return response;
    }
}
