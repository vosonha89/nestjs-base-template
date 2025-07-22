import { Inject, Param, Post, Type } from "@nestjs/common";
import { LoggingServiceSymbol } from "../service/logging.service";
import { ILoggingService } from "../service/interfaces/logging.service.interface";
import { RequestContextServiceSymbol } from "../service/requestContext.service";
import { IRequestContextService } from "../service/interfaces/requestContext.service.interface";
import { ApiBody, ApiParam, ApiResponse } from "@nestjs/swagger";
import { BadRequest, ErrorResponse, InternalServerError, NotFound } from "../../types/errorResponse.type";
import { BaseListResponse, OKResponse, BaseResponse, ApiOkSearchResponseCustom } from "./base.response";
import { ClientError } from "./base.exceptions";
import { BaseCreateRequest, BaseDeleteRequest, BaseSearchRequest, BaseUpdateRequest } from "./base.request";
import { BaseController } from "./base.Controller";
import { BaseType } from "./base.type";
import { IBaseDataService } from "./baseData.service.interface";
import { ObjectHelper } from "../../helpers/objectHelper";

export function BaseDataController<
	TDto extends BaseType<ID>,
	ID,
	TSearchRequest extends BaseSearchRequest,
	TCreateRequest extends BaseCreateRequest,
	TUpdateRequest extends BaseUpdateRequest,
	TDeleteRequest extends BaseDeleteRequest,
>(
	dto: Type<TDto>,
	searchRequest?: Type<TSearchRequest>,
	createRequest?: Type<TCreateRequest>,
	updateRequest?: Type<TUpdateRequest>,
	deteleRequest?: Type<TDeleteRequest>,
) {
	/**
	 * Abstract class `BaseDataControllerWrapper` that extends `BaseController` and provides base functionalities for a data controller.
	 * This class is designed to handle common operations related to data service and logging.
	 *
	 * @template TDto - The Data Transfer Object type associated with the service.
	 * @template ID - The type of the identifier for the entities.
	 *
	 * @extends BaseController
	 */
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
			if (!searchRequest) {
				return NotFound();
			}
			const me = this;
			const request = new searchRequest(me.context);
			request.mapRequest(me.context.getRequest());
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
				response.data.elements = result.data;
				if (request.count) {
					response.data.setTotalElements(result.totalRecord);
				}
				return response;
			} catch (ex) {
				const error = ex as Error;
				me.loggingService.error(error.message, error, me.loggingService.requestToString((me.context.getRequest())));
				return InternalServerError(ex as ClientError);
			}
		}

		@Post('create')
		@ApiBody({ type: createRequest })
		public async create(): Promise<BaseResponse<TDto> | ErrorResponse> {
			if (!createRequest) {
				return NotFound();
			}
			const me = this;
			const request = new createRequest(me.context);
			request.mapRequest(me.context.getRequest());
			let response = BadRequest();
			try {
				if (!request.isValid()) {
					return request.currentError as ErrorResponse;
				}
				const result = await this.dataService.create(me.requestToDto(request));
				response = OKResponse<TDto>();
				response.data = result;
				return response;
			} catch (ex) {
				const error = ex as Error;
				me.loggingService.error(error.message, error, me.loggingService.requestToString((me.context.getRequest())));
				return InternalServerError(ex as ClientError);
			}
		}

		@Post('update/:id')
		@ApiParam({ name: 'id', required: true })
		@ApiBody({ type: updateRequest })
		public async update(@Param('id') id: ID): Promise<BaseResponse<TDto> | ErrorResponse> {
			if (!updateRequest) {
				return NotFound();
			}
			const me = this;
			const request = new updateRequest(me.context);
			request.mapRequest(me.context.getRequest());
			if (!request.id) {
				request.id = id;
			}
			let response = BadRequest();
			try {
				if (!request.isValid()) {
					return request.currentError as ErrorResponse;
				}
				const result = await this.dataService.update(request.id as ID, me.requestToDto(request));
				response = OKResponse<TDto>();
				response.data = result;
				return response;
			} catch (ex) {
				const error = ex as Error;
				me.loggingService.error(error.message, error, me.loggingService.requestToString((me.context.getRequest())));
				return InternalServerError(ex as ClientError);
			}
		}

		@Post('delete/:id')
		@ApiParam({ name: 'id', required: true })
		@ApiBody({ type: deteleRequest })
		public async delete(@Param('id') id: ID): Promise<BaseResponse<TDto> | ErrorResponse> {
			if (!deteleRequest) {
				return NotFound();
			}
			const me = this;
			const request = new deteleRequest(me.context);
			request.mapRequest(me.context.getRequest());
			if (!request.id) {
				request.id = id;
			}
			let response = BadRequest();
			try {
				if (!request.isValid()) {
					return request.currentError as ErrorResponse;
				}
				const result = await this.dataService.delete(request.id as ID);
				response = OKResponse<TDto>();
				response.data = result;
				return response;
			} catch (ex) {
				const error = ex as Error;
				me.loggingService.error(error.message, error, me.loggingService.requestToString((me.context.getRequest())));
				return InternalServerError(ex as ClientError);
			}
		}

		/**
		 * Map modify request to dto
		 * @param request
		 */
		public requestToDto(request: TCreateRequest | TUpdateRequest): TDto {
			const objDto = new dto();
			ObjectHelper.map(request, objDto);
			return objDto;
		}
	}

	return BaseDataControllerWrapper;
}

