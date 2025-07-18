import { Inject, Post, Type } from "@nestjs/common";
import { LoggingServiceSymbol } from "../service/logging.service";
import { ILoggingService } from "../service/interfaces/logging.service.interface";
import { RequestContextServiceSymbol } from "../service/requestContext.service";
import { IRequestContextService } from "../service/interfaces/requestContext.service.interface";
import { ApiBody, ApiResponse } from "@nestjs/swagger";
import { BadRequest, ErrorResponse, InternalServerError } from "../../types/errorResponse.type";
import { BaseListResponse, OKResponse, BaseResponse, ApiOkSearchResponseCustom } from "./base.response";
import { ClientError } from "./base.exceptions";
import { BaseSearchRequest } from "./base.request";
import { BaseController } from "./base.Controller";
import { BaseType } from "./base.type";
import { IBaseDataService } from "./baseData.service.interface";

export function BaseDataController<
	TSearchRequest extends BaseSearchRequest,
	TDto extends BaseType<ID>,
	ID
>(
	searchRequest: Type<TSearchRequest>,
	dto: Type<TDto>) {
	abstract class BaseDataControllerWrapper
		extends BaseController {
		protected constructor(
			@Inject(LoggingServiceSymbol) public readonly loggingService: ILoggingService,
			@Inject(RequestContextServiceSymbol) public readonly context: IRequestContextService,
			public readonly dataService: IBaseDataService<TDto, ID>,
		) {
			super(loggingService, context);
		}

		@Post('search')
		@ApiBody({ type: searchRequest })
		@ApiOkSearchResponseCustom(dto)
		@ApiResponse({ status: 400, description: 'BadRequest', type: ErrorResponse })
		@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponse })
		@ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponse })
		@ApiResponse({ status: 500, description: 'InternalServerError', type: ErrorResponse })
		public async search(): Promise<BaseResponse<BaseListResponse<TDto>> | ErrorResponse> {
			const me = this;
			const request = new searchRequest(me.context);
			let response = BadRequest();
			try {
				if (!request.isValid()) {
					return request.currentError as ErrorResponse;
				}
				const result = await this.dataService.findBy(
					request.filters,
					request.sort,
					(request.page - 1) * request.size,
					request.size,
					request.count
				);
				response = OKResponse<BaseListResponse<TDto>>();
				response.data = new BaseListResponse<TDto>();
				response.data.page = request.page;
				response.data.size = request.size;
				response.data.elements = result[0];
				if (request.count) {
					response.data.setTotalElements(result[1]);
				}
				return response;
			} catch (ex) {
				const error = ex as Error;
				me.loggingService.error(error.message, error, me.loggingService.requestToString((me.context.getRequest())));
				return InternalServerError(ex as ClientError);
			}
		}
	}
	return BaseDataControllerWrapper;
}

