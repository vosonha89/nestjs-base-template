import { ProductDto } from "../../dtos/product.dto";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { RequestContextServiceSymbol } from "../../../domain/common/service/requestContext.service";
import { IRequestContextService } from "../../../domain/common/service/interfaces/requestContext.service.interface";
import {
	ProductRepository,
	ProductRepositorySymbol
} from "../../../../infrastructure/persistence/repositories/product.repository";
import { ProductEntity } from "../../../../infrastructure/persistence/entities/product.entity";
import { BaseDataService } from "src/core/domain/common/base/baseData.service";
import { IProductService } from "../../interfaces/product.service.interface";

/**
 * Symbol and interface definition for Hello World service
 * @namespace ProductService
 */
export const ProductServiceSymbol = Symbol("ProductService");

/**
 * UserService class extends the BaseDataService to provide specific functionality
 * for managing product data. This class is responsible for implementing operations
 * related to products, such as CRUD operations, and ensuring compliance with
 * the IProductService interface.
 *
 * The UserService is designed to handle business logic associated with
 * managing product entities and acts as an intermediary between the application's
 * higher-level components and the data layer.
 *
 * @template T - Represents the DTO model used in the service, in this case, ProductDto.
 * @template U - Represents the type of the identifier for the products, in this case, number.
 *
 * @extends BaseDataService<T, U>
 * @implements IProductService
 */
@Injectable({ scope: Scope.REQUEST })
export class ProductService
	extends BaseDataService<ProductDto, ProductEntity, number>(ProductDto, ProductEntity)
	implements IProductService {
	constructor(
		@Inject(RequestContextServiceSymbol) private readonly requestContext: IRequestContextService,
		@Inject(ProductRepositorySymbol) private readonly productRepository: ProductRepository
	) {
		super(requestContext, productRepository);
	}
}
