import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	Allow,
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsEnum,
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Max,
	Min,
	ValidateNested
} from 'class-validator';
import { ConstantValue } from '../constant/constant-value';
import { FilterCondition } from '../constant/filter-condition';

/**
 * Scalar or list of scalars accepted as a filter value.
 * `In`/`NotIn` expect an array, `Between`/`NotBetween` expect exactly two items.
 */
export type FilterValue = string | number | boolean | Array<string | number | boolean>;

/** Allowed sort directions. */
export type SortDirection = 'ASC' | 'DESC';

/**
 * A single filter clause.
 *
 * `fieldName` is validated against a per-feature whitelist inside
 * `BaseDataService`, which is what stops a client from filtering on
 * sensitive columns such as `password`.
 */
export class BaseFilter {
	/** Column to filter on. */
	@ApiProperty({ description: 'Column to filter on', example: 'email' })
	@IsString()
	@IsNotEmpty()
	public fieldName!: string;

	/** Comparison value. */
	@ApiProperty({
		description: 'Scalar for most operators, array for IN/NOT IN, exactly two items for BETWEEN',
		example: 'admin@demo.io'
	})
	// `@Allow()` whitelists the property for `forbidNonWhitelisted` without
	// constraining it: the accepted shape depends on `filterCondition`, so it is
	// validated by `BaseDataService.toOperator()` instead.
	@Allow()
	public fieldValue!: FilterValue;

	/** Comparison operator. */
	@ApiProperty({ description: 'Comparison operator', enum: FilterCondition, example: FilterCondition.Equal })
	@IsEnum(FilterCondition)
	public filterCondition!: FilterCondition;
}

/**
 * Simplified `field = value` clause used by `existsBy`.
 */
export class BaseFilterWhere {
	/** Column to compare. */
	@ApiProperty({ example: 'email' })
	@IsString()
	@IsNotEmpty()
	public fieldName!: string;

	/** Value the column must equal. */
	@ApiProperty({ example: 'admin@demo.io' })
	@IsNotEmpty()
	public fieldValue!: string;
}

/**
 * A single ordering clause.
 */
export class BaseSort {
	/** Column to order by. Validated against the sortable whitelist. */
	@ApiProperty({ description: 'Column to order by', example: 'id' })
	@IsString()
	@IsNotEmpty()
	public sortField!: string;

	/** Sort direction. */
	@ApiProperty({ description: 'Sort direction', enum: ['ASC', 'DESC'], example: 'DESC' })
	@IsIn(['ASC', 'DESC'])
	public sortType!: SortDirection;
}

/**
 * Common body accepted by every `POST /search` endpoint.
 */
export class BaseSearchRequest {
	/** 1 based page index. */
	@ApiProperty({ description: '1 based page index', default: ConstantValue.PAGE_INDEX, minimum: 1 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	public page: number = ConstantValue.PAGE_INDEX;

	/** Page size, capped by `ConstantValue.MAX_PAGE_SIZE`. */
	@ApiProperty({
		description: 'Page size',
		default: ConstantValue.PAGE_SIZE,
		minimum: 1,
		maximum: ConstantValue.MAX_PAGE_SIZE
	})
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(ConstantValue.MAX_PAGE_SIZE)
	public size: number = ConstantValue.PAGE_SIZE;

	/** When `true` the response also carries `totalElements` and the page flags. */
	@ApiProperty({ description: 'Also return the total number of matching records', default: false })
	@IsOptional()
	@IsBoolean()
	public count: boolean = false;

	/** Filter clauses, AND-ed together. */
	@ApiProperty({ description: 'Filter clauses', type: () => BaseFilter, isArray: true, required: false })
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(20)
	@ValidateNested({ each: true })
	@Type(() => BaseFilter)
	public filters: BaseFilter[] = [];

	/** Ordering clause. Defaults to the feature default when omitted. */
	@ApiProperty({ description: 'Ordering clause', type: () => BaseSort, required: false })
	@IsOptional()
	@ValidateNested()
	@Type(() => BaseSort)
	public sort?: BaseSort;
}

/**
 * Marker base class for create payloads.
 * Subclasses declare the actual fields together with their `class-validator` rules.
 */
export abstract class BaseCreateRequest {}

/**
 * Marker base class for update payloads.
 * Subclasses declare the mutable fields together with their `class-validator` rules.
 */
export abstract class BaseUpdateRequest {}

/**
 * Marker base class for delete payloads.
 * The identifier itself always travels in the URL path.
 */
export abstract class BaseDeleteRequest {}

/**
 * Payload accepted by a "get one by id" endpoint.
 */
export class BaseGetByIdRequest {
	/** Identifier of the requested record. */
	@ApiProperty({ description: 'Identifier of the requested record', example: 1 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	public id!: number;
}
