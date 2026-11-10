import { Body, Controller, HttpCode, HttpStatus, Inject, Param, Post } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseDataController } from '@common/base/base-data.controller';
import { BaseResponse, OKResponse } from '@common/base/base.response';
import { ErrorResponse } from '@common/exception/error-response';
import { AppValidationPipe } from '@common/pipe/app-validation.pipe';
import { ParseEntityIdPipe } from '@common/pipe/parse-entity-id.pipe';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { IRequestContextService } from '@common/service/request-context.service.interface';
import { ProductDto } from '@services/product/product.dto';
import { ProductServiceSymbol } from '@services/product/product.service';
import { IProductService } from '@services/product/product.service.interface';
import { ProductCreateRequest } from './request/product-create.request';
import {
	ProductAdjustStockRequest,
	ProductDeleteRequest,
	ProductSearchRequest
} from './request/product-search.request';
import { ProductUpdateRequest } from './request/product-update.request';
import { ProductListResponse } from './response/product-search.response';

/**
 * HTTP surface of the product feature.
 *
 * Besides the inherited CRUD endpoints it exposes `adjust-stock`, which shows
 * how to add an operation with real business rules and a transaction boundary.
 */
@ApiTags('product')
@ApiExtraModels(ProductListResponse)
@Controller({ path: 'product', version: '1' })
export class ProductController extends BaseDataController<
	ProductDto,
	number,
	ProductSearchRequest,
	ProductCreateRequest,
	ProductUpdateRequest,
	ProductDeleteRequest,
	IProductService
>(ProductDto, ProductSearchRequest, ProductCreateRequest, ProductUpdateRequest, ProductDeleteRequest) {
	/**
	 * Constructor
	 * @param loggingService - Structured logger
	 * @param context - Request scoped data
	 * @param dataService - Business service backing this controller
	 */
	public constructor(
		@Inject(LoggingServiceSymbol) loggingService: ILoggingService,
		@Inject(RequestContextServiceSymbol) context: IRequestContextService,
		@Inject(ProductServiceSymbol) dataService: IProductService
	) {
		super(loggingService, context, dataService);
	}

	/**
	 * Adjusts the stock level by a signed delta.
	 *
	 * Demonstrates the recommended shape for a non-CRUD operation:
	 * dedicated request class, business rules in the service, transaction in the
	 * repository, and the shared response envelope.
	 * @param id - Identifier of the product
	 * @param request - Validated payload carrying `delta`
	 * @returns The updated product
	 */
	@Post(':id/adjust-stock')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Adjust stock by a signed delta inside a transaction' })
	@ApiParam({ name: 'id', required: true, type: Number })
	@ApiBody({ type: ProductAdjustStockRequest })
	@ApiOkResponse({ description: 'The product with its updated stock level', type: ProductDto })
	@ApiResponse({ status: 400, description: 'BadRequest', type: ErrorResponse })
	@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponse })
	@ApiResponse({ status: 404, description: 'NotFound', type: ErrorResponse })
	public async adjustStock(
		@Param('id', ParseEntityIdPipe) id: number,
		@Body(new AppValidationPipe({ expectedType: ProductAdjustStockRequest })) request: ProductAdjustStockRequest
	): Promise<BaseResponse<ProductDto>> {
		const updated = await this.dataService.adjustStock(id, request.delta);
		return OKResponse<ProductDto>(updated);
	}
}
