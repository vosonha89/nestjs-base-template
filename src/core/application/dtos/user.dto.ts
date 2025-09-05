import { BaseType } from "../../domain/common/base/base.type";

/**
 * Response DTO for product data that matches the structure of ProductEntity
 */
export class UserDto extends BaseType<number> {
	id!: number;
	firstName?: string;
	lastName?: string;
	maidenName?: string;
	age?: number;
	gender?: string;
	email?: string;
	phone?: string;
	username?: string;
	birthDate?: string;
	image?: string;
	bloodGroup?: string;
	height?: number;
	weight?: number;
	eyeColor?: string;
	hairColor?: string;
	hairType?: string;
	ip?: string;
	addressAddress?: string;
	addressCity?: string;
	addressState?: string;
	addressStateCode?: string;
	addressPostalCode?: string;
	addressCoordinatesLat?: number;
	addressCoordinatesLng?: number;
	addressCountry?: string;
	macAddress?: string;
	university?: string;
	bankCardExpire?: string;
	bankCardType?: string;
	bankCurrency?: string;
	companyDepartment?: string;
	companyName?: string;
	companyTitle?: string;
	companyAddressAddress?: string;
	companyAddressCity?: string;
	companyAddressState?: string;
	companyAddressStateCode?: string;
	companyAddressPostalCode?: string;
	companyAddressCoordinatesLat?: number;
	companyAddressCoordinatesLng?: number;
	companyAddressCountry?: string;
	ein?: string;
	userAgent?: string;
	cryptoCoin?: string;
	cryptoWallet?: string;
	cryptoNetwork?: string;
	role?: string;
	createdAt?: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}
