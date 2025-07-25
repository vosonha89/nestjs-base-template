import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ClientError } from './base.exceptions';
import { GenericObject, SourceObject } from '../../types/genericObject.type';
import { ObjectHelper } from '../../helpers/objectHelper';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from "@nestjs/swagger";

/**
 * A custom decorator for defining the standard API response structure for successful requests
 * with a generic data type. This applies multiple decorators including `ApiExtraModels` and
 * `ApiOkResponse` to specify the response schema.
 *
 * @template GenericType The generic type extending from `Type<unknown>` to define the `data` type in the response.
 * @param {GenericType} data The class or type representing the `data` property in the response body.
 * @returns The applied decorators to enhance the response metadata and schema.
 */
export const ApiOkResponseCustom = <GenericType extends Type<unknown>>(data: GenericType) =>
	applyDecorators(
		ApiExtraModels(BaseResponse, data),
		ApiOkResponse({
			description: `The Response result of ${ data.name }`,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(BaseResponse) },
					{
						properties: {
							data: {
								$ref: getSchemaPath(data),
							},
						},
					},
				],
			},
		}),
	);

/**
 * A custom decorator factory to define an API response that describes a paginated or list-based
 * result for a specific data type. This combines metadata for the `ApiExtraModels` and `ApiOkResponse`
 * decorators while dynamically linking the provided data model.
 *
 * @param data The generic data type for which the API response structure is defined. Must extend a valid Type.
 * @template GenericType The type of the data, which extends a class representing a result model.
 * @returns A combination of decorators that configure additional metadata and response structure for the API.
 */
export const ApiOkSearchResponseCustom = <GenericType extends Type<unknown>>(data: GenericType) =>
	applyDecorators(
		ApiExtraModels(BaseListResponse, BaseResponse, data),
		ApiOkResponse({
			description: `The response paged result of ${ data.name }`,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(BaseResponse) },
					{
						properties: {
							data: {
								$ref: getSchemaPath(BaseListResponse),
								properties: {
									elements: {
										type: 'array',
										items: {
											type: 'object',
											$ref: getSchemaPath(data)
										}
									},
								},
							},
						},
					},
				],
			},
		}),
	);

/**
 * Base response
 */
export class BaseResponseData<T> {
	@ApiProperty()
	public serverDateTime!: Date;
	@ApiProperty()
	public status!: number;
	@ApiProperty()
	public msg!: string;
	@ApiProperty({ type: ClientError })
	public exception?: ClientError;
	@ApiProperty()
	public data!: T | undefined;
	@ApiProperty()
	public successful!: boolean;

	constructor() {
		this.serverDateTime = new Date();
		this.status = HttpStatus.BAD_REQUEST;
		this.msg = '';
		this.exception = undefined;
		this.data = undefined;
		this.successful = false;
	}
}

/**
 * Base search response
 */
export class BaseListResponse<T> {
	@ApiProperty()
	public page!: number;
	@ApiProperty()
	public size!: number;
	@ApiProperty()
	public totalElements!: number;

	public setTotalElements(value: number) {
		this.totalElements = value;
		this.totalPages = Math.ceil(this.totalElements / this.size);
		this.hasMore = this.totalPages > this.page;
		this.hasPrevious = this.page > 1;
	}

	@ApiProperty()
	public totalPages!: number;
	@ApiProperty()
	public elements!: T[];
	@ApiProperty()
	public hasPrevious!: boolean;
	@ApiProperty()
	public hasMore!: boolean;
}

/**
 * Base item response
 */
export class BaseItemResponse<T extends SourceObject> extends GenericObject<T> {
	public id = '';

	public override map(object: T): void {
		ObjectHelper.map(object, this);
	}
}

/**
 * Normal response
 */
export class BaseResponse<T> extends BaseResponseData<T> {
	constructor(status: HttpStatus, data: T | undefined = undefined, successful = false, msg = '', exception = undefined) {
		super();
		this.status = status;
		this.msg = msg;
		this.exception = exception;
		this.data = data;
		this.successful = successful;
	}
}

/**
 * Ok response
 */
export const OKResponse = <T>(data?: T) => {
	return new BaseResponse<T>(HttpStatus.OK, data, true);
};
