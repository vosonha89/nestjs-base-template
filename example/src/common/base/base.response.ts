import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ClientError } from '../exception/client-error';

/**
 * Reads the runtime name of a model class without falling back to `any`.
 * @param model - Model class
 * @returns The class name
 */
function modelName(model: Type<unknown>): string {
	return (model as unknown as { name: string }).name;
}

/**
 * Every response produced by the API shares this envelope.
 *
 * Keeping HTTP status in `status` as well as on the wire lets clients written
 * against the original template keep working while still allowing proper
 * status-code based monitoring.
 * @template T - Type of the `data` payload
 */
export class BaseResponseData<T> {
	/** Server timestamp, serialised as an ISO 8601 string. */
	@ApiProperty({ description: 'Server timestamp (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
	public serverDateTime!: Date;

	/** HTTP status code, mirrored from the transport layer. */
	@ApiProperty({ description: 'HTTP status code', example: 200 })
	public status!: number;

	/** Human readable summary. */
	@ApiProperty({ description: 'Human readable message', example: 'OK' })
	public msg!: string;

	/** Present only on failures. */
	@ApiProperty({
		description: 'Error payload, omitted on success',
		type: () => ClientError,
		required: false
	})
	public exception?: ClientError;

	/** Operation result, omitted on failure. */
	@ApiProperty({ description: 'Operation payload', required: false })
	public data?: T;

	/** `true` only when the operation succeeded. */
	@ApiProperty({ description: 'True only when the operation succeeded', example: true })
	public successful!: boolean;

	/**
	 * Constructor
	 */
	public constructor() {
		this.serverDateTime = new Date();
		this.status = HttpStatus.BAD_REQUEST;
		this.msg = '';
		this.successful = false;
	}
}

/**
 * Pagination metadata attached to `data` by every search endpoint.
 * @template T - Element type
 */
export class BaseListResponse<T> {
	/** 1 based page index. */
	@ApiProperty({ example: 1 })
	public page!: number;

	/** Requested page size. */
	@ApiProperty({ example: 10 })
	public size!: number;

	/** Total number of matching records, ignoring pagination. Only present when `count` was requested. */
	@ApiProperty({ example: 42, required: false })
	public totalElements?: number;

	/** Total number of pages, only present when `count` was requested. */
	@ApiProperty({ example: 5, required: false })
	public totalPages?: number;

	/** Page content. */
	@ApiProperty({ isArray: true })
	public elements!: T[];

	/** `true` when a previous page exists. */
	@ApiProperty({ example: false })
	public hasPrevious!: boolean;

	/** `true` when a next page exists. */
	@ApiProperty({ example: true })
	public hasMore!: boolean;

	/**
	 * Fills the total counters and the derived pagination flags.
	 * @param value - Total number of matching records
	 */
	public setTotalElements(value: number): void {
		this.totalElements = value;
		this.totalPages = this.size > 0 ? Math.ceil(this.totalElements / this.size) : 0;
		this.hasMore = this.totalPages > this.page;
		this.hasPrevious = this.page > 1;
	}
}

/**
 * Successful response envelope.
 * @template T - Type of the `data` payload
 */
export class BaseResponse<T> extends BaseResponseData<T> {
	/**
	 * Constructor
	 * @param status - HTTP status code
	 * @param data - Operation payload
	 * @param successful - Whether the operation succeeded
	 * @param msg - Human readable summary
	 */
	public constructor(status: HttpStatus, data?: T, successful = false, msg = '') {
		super();
		this.status = status;
		this.data = data;
		this.successful = successful;
		this.msg = msg;
	}
}

/**
 * Builds a successful `200 OK` envelope.
 * @param data - Operation payload
 * @returns The envelope
 */
export const OKResponse = <T>(data?: T): BaseResponse<T> => new BaseResponse<T>(HttpStatus.OK, data, true, 'OK');

/**
 * Builds a successful `201 Created` envelope.
 * @param data - Operation payload
 * @returns The envelope
 */
export const CreatedResponse = <T>(data?: T): BaseResponse<T> =>
	new BaseResponse<T>(HttpStatus.CREATED, data, true, 'Created');

/**
 * Swagger helper describing a single-item response.
 * @param data - Model class of the `data` payload
 * @returns Composed Swagger decorators
 */
export const ApiOkResponseCustom = <TModel extends Type<unknown>>(data: TModel): ReturnType<typeof applyDecorators> =>
	applyDecorators(
		ApiExtraModels(BaseResponseData, data),
		ApiOkResponse({
			description: `Successful response wrapping ${modelName(data)}`,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(BaseResponseData) },
					{
						properties: {
							data: { $ref: getSchemaPath(data) }
						}
					}
				]
			}
		})
	);

/**
 * Swagger helper describing a paginated response.
 * @param data - Model class of each element in `data.elements`
 * @returns Composed Swagger decorators
 */
export const ApiOkSearchResponseCustom = <TModel extends Type<unknown>>(
	data: TModel
): ReturnType<typeof applyDecorators> =>
	applyDecorators(
		ApiExtraModels(BaseListResponse, BaseResponseData, data),
		ApiOkResponse({
			description: `Paginated response wrapping ${modelName(data)}`,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(BaseResponseData) },
					{
						properties: {
							data: {
								allOf: [
									{ $ref: getSchemaPath(BaseListResponse) },
									{
										properties: {
											elements: {
												type: 'array',
												items: { $ref: getSchemaPath(data) }
											}
										}
									}
								]
							}
						}
					}
				]
			}
		})
	);
