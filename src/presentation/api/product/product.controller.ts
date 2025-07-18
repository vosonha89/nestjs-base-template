import { Controller, Inject } from "@nestjs/common";
import { IRequestContextService } from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import { RequestContextServiceSymbol } from "../../../core/domain/common/service/requestContext.service";
import { ProductServiceSymbol } from "../../../core/application/services/product/product.service";
import { IProductService } from "../../../core/application/interfaces/product.service.interface";
import { ProductSearchRequest } from "./requests/productSearch.request";
import { ProductListResponse } from "./responses/productSearch.response";
import { ILoggingService } from "../../../core/domain/common/service/interfaces/logging.service.interface";
import { LoggingServiceSymbol } from "../../../core/domain/common/service/logging.service";
import { ApiExtraModels } from "@nestjs/swagger";
import { ProductDto } from "../../../core/application/dtos/product.dto";
import { BaseDataController } from "../../../core/domain/common/base/base.Data.Controller";

@ApiExtraModels(ProductListResponse)
@Controller('product')
export class ProductController extends BaseDataController<ProductSearchRequest, ProductDto, number>
(
	ProductSearchRequest,
	ProductDto
) {
	constructor(
		@Inject(LoggingServiceSymbol) public readonly loggingService: ILoggingService,
		@Inject(RequestContextServiceSymbol) public readonly context: IRequestContextService,
		@Inject(ProductServiceSymbol) public readonly dataService: IProductService,
	) {
		super(loggingService, context, dataService);
	}
}
