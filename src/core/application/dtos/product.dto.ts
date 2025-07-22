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
}
