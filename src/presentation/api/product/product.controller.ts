import { Controller, Post, Inject } from "@nestjs/common";
import { IRequestContextService } from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import { RequestContextServiceSymbol } from "../../../core/domain/common/service/requestContext.service";
import { ProductServiceSymbol } from "../../../core/application/services/product/product.service";
import { IProductService } from "../../../core/application/interfaces/product.service.interface";
import { ProductSearchRequest } from "./requests/productSearch.request";
import { ProductListResponse, ProductSearchResponse } from "./responses/productSearch.response";
import { OKResponse } from "../../../core/domain/common/base/base.response";
import { ErrorResponse, InternalServerError } from "../../../core/domain/types/errorResponse.type";
import { ClientError } from "../../../core/domain/common/base/base.exceptions";
import { ILoggingService } from "../../../core/domain/common/service/interfaces/logging.service.interface";
import { LoggingServiceSymbol } from "../../../core/domain/common/service/logging.service";

@Controller('product')
export class ProductController {
	constructor(
		@Inject(LoggingServiceSymbol) private readonly loggingService: ILoggingService,
		@Inject(RequestContextServiceSymbol) private readonly context: IRequestContextService,
		@Inject(ProductServiceSymbol) private readonly productService: IProductService,
	) {
	}

	@Post('search')
	public async search(request: ProductSearchRequest): Promise<ProductSearchResponse | ErrorResponse> {
		const me = this;
		request.page = 0;
		request.size = 10;
		let response = new ProductSearchResponse;
		try {
			if (!request.isValid()) {
				return request.currentError as ErrorResponse;
			}
			const result = await this.productService.findBy(
				{
					skip: request.page * request.size,
					take: request.page
				}
			);
			response = OKResponse<ProductListResponse>();
			response.data = new ProductListResponse();
			response.data.page = request.page;
			response.data.size = request.size;
			response.data.elements = result;
			return response;
		} catch (ex) {
			const error = ex as Error;
			me.loggingService.error(error.message, error, me.loggingService.requestToString((me.context.getRequest())));
			return InternalServerError(ex as ClientError);
		}
	}
}
