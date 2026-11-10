import { Body, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Type } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AppError, ClientError } from '../exception/client-error';
import { ErrorResponse } from '../exception/error-response';
import { GlobalError } from '../exception/global-error';
import { ObjectHelper } from '../helper/object.helper';
import { AppValidationPipe } from '../pipe/app-validation.pipe';
import { ParseEntityIdPipe } from '../pipe/parse-entity-id.pipe';
import { LoggingServiceSymbol } from '../service/logging.service';
import { ILoggingService } from '../service/logging.service.interface';
import { RequestContextServiceSymbol } from '../service/request-context.service';
import { IRequestContextService } from '../service/request-context.service.interface';
import { BaseController } from './base.controller';
import { BaseCreateRequest, BaseDeleteRequest, BaseSearchRequest, BaseUpdateRequest } from './base.request';
import {
	ApiOkResponseCustom,
	ApiOkSearchResponseCustom,
	BaseListResponse,
	BaseResponse,
	CreatedResponse,
	OKResponse
} from './base.response';
import { BaseType } from './base.type';
import { IBaseDataService } from './base-data.service.interface';

/**
 * Produces a controller exposing the standard CRUD surface for one feature.
 *
 * A factory (rather than a plain abstract class) is used because Swagger and
 * `AppValidationPipe` need the concrete request classes at class-definition
 * time, which a generic type parameter cannot provide.
 * @template TDto - DTO returned by the endpoints
 * @template TId - Type of the identifier
 * @template TSearchRequest - Request class accepted by `POST /search`
 * @template TCreateRequest - Request class accepted by `POST /`
 * @template TUpdateRequest - Request class accepted by `PUT /:id`
 * @template TDeleteRequest - Request class accepted by `DELETE /:id`
 * @param dto - DTO class
 * @param searchRequest - Request class for search
 * @param createRequest - Request class for create
 * @param updateRequest - Request class for update
 * @param _deleteRequest - Request class for delete, kept for symmetry and Swagger
 * @returns The controller class to extend
 */
export function BaseDataController<
	TDto extends BaseType<TId>,
	TId,
	TSearchRequest extends BaseSearchRequest,
	TCreateRequest extends BaseCreateRequest,
	TUpdateRequest extends BaseUpdateRequest,
	TDeleteRequest extends BaseDeleteRequest,
	TService extends IBaseDataService<TDto, TId> = IBaseDataService<TDto, TId>
>(
	dto: Type<TDto>,
	searchRequest: Type<TSearchRequest>,
	createRequest: Type<TCreateRequest>,
	updateRequest: Type<TUpdateRequest>,
	_deleteRequest: Type<TDeleteRequest>
) {
	/**
	 * Concrete controller base wired to a single data service.
	 */
	@ApiBearerAuth()
	abstract class BaseDataControllerWrapper extends BaseController {
		/**
		 * Constructor
		 * @param loggingService - Structured logger
		 * @param context - Request scoped data
		 * @param dataService - Business service backing this controller
		 */
		protected constructor(
			@Inject(LoggingServiceSymbol) loggingService: ILoggingService,
			@Inject(RequestContextServiceSymbol) context: IRequestContextService,
			public readonly dataService: TService
		) {
			super(loggingService, context);
		}

		/**
		 * Returns a page of records matching the supplied filters.
		 * @param request - Validated search payload
		 * @returns The paginated envelope
		 */
		@Post('search')
		@HttpCode(HttpStatus.OK)
		@ApiOperation({ summary: 'Search records with filters, sorting and pagination' })
		@ApiBody({ type: searchRequest })
		@ApiOkSearchResponseCustom(dto)
		@ApiResponse({ status: 400, description: 'BadRequest', type: ErrorResponse })
		@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponse })
		@ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponse })
		@ApiResponse({ status: 500, description: 'InternalServerError', type: ErrorResponse })
		public async search(
			@Body(new AppValidationPipe({ expectedType: searchRequest })) request: TSearchRequest
		): Promise<BaseResponse<BaseListResponse<TDto>>> {
			const result = await this.dataService.findBy(
				request.filters,
				request.sort,
				(request.page - 1) * request.size,
				request.size,
				request.count
			);

			const list = new BaseListResponse<TDto>();
			list.page = request.page;
			list.size = request.size;
			list.elements = result.elements;
			list.hasPrevious = request.page > 1;
			list.hasMore = result.elements.length === request.size;

			if (request.count) {
				list.setTotalElements(result.totalRecord);
			}

			return OKResponse<BaseListResponse<TDto>>(list);
		}

		/**
		 * Creates a record.
		 * @param request - Validated create payload
		 * @returns The created record wrapped in a `201` envelope
		 */
		@Post()
		@HttpCode(HttpStatus.CREATED)
		@ApiOperation({ summary: 'Create a record' })
		@ApiBody({ type: createRequest })
		@ApiOkResponseCustom(dto)
		@ApiResponse({ status: 400, description: 'BadRequest', type: ErrorResponse })
		@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponse })
		@ApiResponse({ status: 409, description: 'Conflict', type: ErrorResponse })
		@ApiResponse({ status: 500, description: 'InternalServerError', type: ErrorResponse })
		public async create(
			@Body(new AppValidationPipe({ expectedType: createRequest })) request: TCreateRequest
		): Promise<BaseResponse<TDto>> {
			const payload = ObjectHelper.map(request, dto, { onlyExposed: false });
			const created = await this.dataService.create(payload);
			return CreatedResponse<TDto>(created);
		}

		/**
		 * Retrieves a single record by identifier.
		 * @param id - Identifier from the URL path
		 * @returns The record wrapped in an envelope
		 * @throws AppError `404` when the record does not exist
		 */
		@Get(':id')
		@HttpCode(HttpStatus.OK)
		@ApiOperation({ summary: 'Get one record by id' })
		@ApiParam({ name: 'id', required: true, type: Number })
		@ApiOkResponseCustom(dto)
		@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponse })
		@ApiResponse({ status: 404, description: 'NotFound', type: ErrorResponse })
		public async findOne(@Param('id', ParseEntityIdPipe) id: TId): Promise<BaseResponse<TDto>> {
			const found = await this.dataService.findById(id);

			if (found === undefined) {
				const message = GlobalError.NotFoundError;
				throw new AppError(
					HttpStatus.NOT_FOUND,
					new ClientError(String(message.code), `Record with id ${String(id)} was not found.`)
				);
			}

			return OKResponse<TDto>(found);
		}

		/**
		 * Updates a record.
		 * @param id - Identifier from the URL path
		 * @param request - Validated update payload, `undefined` fields are ignored
		 * @returns The updated record wrapped in an envelope
		 * @throws AppError `404` when the record does not exist
		 */
		@Put(':id')
		@HttpCode(HttpStatus.OK)
		@ApiOperation({ summary: 'Update a record' })
		@ApiParam({ name: 'id', required: true, type: Number })
		@ApiBody({ type: updateRequest })
		@ApiOkResponseCustom(dto)
		@ApiResponse({ status: 400, description: 'BadRequest', type: ErrorResponse })
		@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponse })
		@ApiResponse({ status: 404, description: 'NotFound', type: ErrorResponse })
		public async update(
			@Param('id', ParseEntityIdPipe) id: TId,
			@Body(new AppValidationPipe({ expectedType: updateRequest })) request: TUpdateRequest
		): Promise<BaseResponse<TDto>> {
			const payload = ObjectHelper.map(request, dto, { onlyExposed: false });
			const updated = await this.dataService.update(id, payload);
			return OKResponse<TDto>(updated);
		}

		/**
		 * Soft deletes a record.
		 * @param id - Identifier from the URL path
		 * @returns `true` wrapped in an envelope
		 * @throws AppError `404` when the record does not exist
		 */
		@Delete(':id')
		@HttpCode(HttpStatus.OK)
		@ApiOperation({ summary: 'Soft delete a record' })
		@ApiParam({ name: 'id', required: true, type: Number })
		@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponse })
		@ApiResponse({ status: 404, description: 'NotFound', type: ErrorResponse })
		public async delete(@Param('id', ParseEntityIdPipe) id: TId): Promise<BaseResponse<boolean>> {
			const deleted = await this.dataService.delete(id);

			if (!deleted) {
				const message = GlobalError.NotFoundError;
				throw new AppError(
					HttpStatus.NOT_FOUND,
					new ClientError(String(message.code), `Record with id ${String(id)} was not found.`)
				);
			}

			return OKResponse<boolean>(true);
		}
	}

	return BaseDataControllerWrapper;
}
