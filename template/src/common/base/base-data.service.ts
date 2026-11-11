import { HttpStatus, Inject, Type } from '@nestjs/common';
import {
	Between,
	Equal,
	FindManyOptions,
	FindOperator,
	FindOptionsOrder,
	FindOptionsWhere,
	In,
	LessThan,
	LessThanOrEqual,
	Like,
	MoreThan,
	MoreThanOrEqual,
	Not
} from 'typeorm';
import { ConstantValue } from '../constant/constant-value';
import { FilterCondition } from '../constant/filter-condition';
import { AppError, ClientError } from '../exception/client-error';
import { GlobalError } from '../exception/global-error';
import { ObjectHelper } from '../helper/object.helper';
import { RequestContextServiceSymbol } from '../service/request-context.service';
import { IRequestContextService } from '../service/request-context.service.interface';
import { BaseEntity } from './base.entity';
import { BaseFilter, BaseFilterWhere, BaseSort, FilterValue, SortDirection } from './base.request';
import { IBaseRepository } from './base.repository';
import { BaseType, DynamicRecord, Paginated } from './base.type';
import { IBaseDataService } from './base-data.service.interface';

/**
 * Wiring options for a concrete data service.
 * @template TDto - DTO exposed by the service
 * @template TEntity - Persisted entity type
 */
export interface IBaseDataServiceOptions<TDto, TEntity> {
	/** DTO class returned to callers. */
	readonly dto: Type<TDto>;

	/** Entity class backing the DTO. */
	readonly entity: Type<TEntity>;

	/**
	 * Columns a client is allowed to filter on.
	 *
	 * This is a security whitelist: anything outside of it is rejected with
	 * `4007`, so a client can never probe sensitive columns such as
	 * `password`, `ssn` or `bankCardNumber`.
	 */
	readonly searchableFields: readonly string[];

	/** Columns a client is allowed to sort on. Defaults to `searchableFields` plus `id`. */
	readonly sortableFields?: readonly string[];

	/** Column used when the client omits `sort`. Defaults to `id`. */
	readonly defaultSortField?: string;

	/** Direction used when the client omits `sort`. Defaults to `DESC`. */
	readonly defaultSortDirection?: SortDirection;
}

/**
 * Generic CRUD implementation shared by every data service.
 *
 * Concrete services extend this class and only supply the wiring plus their
 * domain specific methods, which keeps the boilerplate close to zero while
 * still leaving room for real business rules.
 * @template TDto - DTO exposed by the service
 * @template TEntity - Persisted entity type
 * @template TId - Type of the identifier field
 */
export abstract class BaseDataService<
	TDto extends BaseType<TId>,
	TEntity extends BaseEntity<TId>,
	TId
> implements IBaseDataService<TDto, TId> {
	/** Request scoped data, see {@link IRequestContextService}. */
	protected readonly context: IRequestContextService;

	/** Storage port used by this service. */
	protected readonly repository: IBaseRepository<TEntity, TId>;

	/** Columns accepted in `filters[].fieldName`. */
	protected readonly searchableFields: ReadonlySet<string>;

	/** Columns accepted in `sort.sortField`. */
	protected readonly sortableFields: ReadonlySet<string>;

	/** DTO class, used to map entities on the way out. */
	private readonly dtoType: Type<TDto>;

	/** Entity class, used to instantiate new rows. */
	private readonly entityType: Type<TEntity>;

	/** Ordering applied when the client omits `sort`. */
	private readonly defaultSort: BaseSort;

	/**
	 * Constructor
	 * @param requestContextService - Service exposing the current request
	 * @param dataRepository - Storage port
	 * @param options - Wiring options, see {@link IBaseDataServiceOptions}
	 */
	protected constructor(
		@Inject(RequestContextServiceSymbol) requestContextService: IRequestContextService,
		dataRepository: IBaseRepository<TEntity, TId>,
		options: IBaseDataServiceOptions<TDto, TEntity>
	) {
		this.context = requestContextService;
		this.repository = dataRepository;
		this.dtoType = options.dto;
		this.entityType = options.entity;
		this.searchableFields = new Set(options.searchableFields);

		const sortable = new Set<string>(options.sortableFields ?? options.searchableFields);
		sortable.add('id');
		this.sortableFields = sortable;

		this.defaultSort = {
			sortField: options.defaultSortField ?? 'id',
			sortType: options.defaultSortDirection ?? 'DESC'
		};
	}

	/**
	 * Retrieves one record by identifier.
	 * @param id - Identifier of the record
	 * @returns The DTO, or `undefined` when the record does not exist
	 */
	public async findById(id: TId): Promise<TDto | undefined> {
		const entity = await this.repository.findById(id);
		return entity === null ? undefined : this.toDto(entity);
	}

	/**
	 * Retrieves a page of records.
	 * @param filters - Filter clauses, AND-ed together
	 * @param sort - Ordering clause, falls back to the service default
	 * @param skip - Number of records to skip
	 * @param take - Maximum number of records to return
	 * @param count - When `true`, `totalRecord` is populated with a separate count query
	 * @returns The page content and, optionally, the total record count
	 */
	public async findBy(
		filters: BaseFilter[],
		sort?: BaseSort,
		skip?: number,
		take?: number,
		count?: boolean
	): Promise<Paginated<TDto>> {
		const where = this.buildWhere(filters);
		const order = this.buildOrder(sort);

		const condition: FindManyOptions<TEntity> = {
			skip: skip ?? 0,
			take: Math.min(take ?? ConstantValue.PAGE_SIZE, ConstantValue.MAX_PAGE_SIZE),
			where,
			order
		};

		const [entities, totalRecord] = await Promise.all([
			this.repository.find(condition),
			count === true ? this.repository.count({ where }) : Promise.resolve(0)
		]);

		return {
			elements: entities.map((entity: TEntity) => this.toDto(entity)),
			totalRecord
		};
	}

	/**
	 * Creates a record.
	 * @param data - Fields of the new record
	 * @returns The created DTO
	 */
	public async create(data: Partial<TDto>): Promise<TDto> {
		const entity = new this.entityType();
		ObjectHelper.assign(data, entity, ['id', 'createdAt', 'updatedAt', 'deletedAt']);
		const saved = await this.repository.save(entity);
		return this.toDto(saved);
	}

	/**
	 * Updates a record.
	 * @param id - Identifier of the record
	 * @param data - Fields to change, `undefined` values are ignored
	 * @returns The updated DTO
	 * @throws AppError `404` when the record does not exist
	 */
	public async update(id: TId, data: Partial<TDto>): Promise<TDto> {
		const entity = await this.repository.findById(id);

		if (entity === null) {
			throw this.notFound(id);
		}

		ObjectHelper.assign(data, entity, ['id', 'createdAt', 'updatedAt', 'deletedAt']);
		const updated = await this.repository.update(entity);
		return this.toDto(updated);
	}

	/**
	 * Soft deletes a record.
	 * @param id - Identifier of the record
	 * @returns `true` when a record was deleted
	 */
	public async delete(id: TId): Promise<boolean> {
		const entity = await this.repository.findById(id);

		if (entity === null) {
			return false;
		}

		return this.repository.delete(id);
	}

	/**
	 * Checks existence by identifier.
	 * @param id - Identifier of the record
	 * @returns `true` when the record exists
	 */
	public async exists(id: TId): Promise<boolean> {
		return this.repository.exists(id);
	}

	/**
	 * Checks existence by equality clauses.
	 * @param filters - Equality clauses, AND-ed together
	 * @returns `true` when at least one record matches
	 */
	public async existsBy(filters: BaseFilterWhere[]): Promise<boolean> {
		const where: DynamicRecord = {};

		for (const filter of filters) {
			this.assertAllowedField(filter.fieldName, this.searchableFields, 'filter');
			where[filter.fieldName] = Equal(filter.fieldValue);
		}

		return this.repository.existsBy(where as unknown as FindOptionsWhere<TEntity>);
	}

	/**
	 * Maps an entity onto the service DTO.
	 *
	 * Only properties decorated with `@Expose()` on the DTO are copied, so a
	 * column added to the entity can never leak through the API by accident.
	 * @param entity - Entity to map
	 * @returns The DTO
	 */
	protected toDto(entity: TEntity): TDto {
		return ObjectHelper.map(entity, this.dtoType);
	}

	/**
	 * Builds the `where` clause from the client supplied filters.
	 * @param filters - Filter clauses
	 * @returns A TypeORM `where` object
	 * @throws AppError `4007` when a filter targets a non searchable column
	 */
	protected buildWhere(filters: BaseFilter[]): FindOptionsWhere<TEntity> {
		const where: DynamicRecord = {};

		for (const filter of filters) {
			this.assertAllowedField(filter.fieldName, this.searchableFields, 'filter');
			where[filter.fieldName] = this.toOperator(filter);
		}

		return where as unknown as FindOptionsWhere<TEntity>;
	}

	/**
	 * Builds the `order` clause, keeping `id` as a tie breaker so pagination is
	 * deterministic when the primary sort column has duplicates.
	 * @param sort - Client supplied ordering, optional
	 * @returns A TypeORM `order` object
	 * @throws AppError `4007` when the sort targets a non sortable column
	 */
	protected buildOrder(sort?: BaseSort): FindOptionsOrder<TEntity> {
		const resolved = sort ?? this.defaultSort;
		this.assertAllowedField(resolved.sortField, this.sortableFields, 'sort');

		const order: DynamicRecord = {};
		order[resolved.sortField] = resolved.sortType;

		if (resolved.sortField !== 'id') {
			order['id'] = resolved.sortType;
		}

		return order as unknown as FindOptionsOrder<TEntity>;
	}

	/**
	 * Converts a filter clause into a TypeORM operator.
	 * @param filter - Filter clause
	 * @returns The operator to store in the `where` object
	 */
	protected toOperator(filter: BaseFilter): FindOperator<FilterValue> {
		const value = filter.fieldValue;

		switch (filter.filterCondition) {
			case FilterCondition.Like:
				return Like(`%${String(value)}%`);
			case FilterCondition.Equal:
				return Equal(value);
			case FilterCondition.In:
				// Upstream `In()` is declared as returning `FindOperator<any>`,
				// so the result has to be narrowed back to the operator union.
				return In<string | number | boolean>(this.toArray(value)) as FindOperator<FilterValue>;
			case FilterCondition.NotIn:
				return Not(In<string | number | boolean>(this.toArray(value))) as FindOperator<FilterValue>;
			case FilterCondition.NotEqual:
				return Not(Equal(value));
			case FilterCondition.GreaterThan:
				return MoreThan(this.toScalar(value));
			case FilterCondition.GreaterThanOrEqual:
				return MoreThanOrEqual(this.toScalar(value));
			case FilterCondition.LessThan:
				return LessThan(this.toScalar(value));
			case FilterCondition.LessThanOrEqual:
				return LessThanOrEqual(this.toScalar(value));
			case FilterCondition.Between: {
				const range = this.toRange(value);
				return Between(range[0], range[1]);
			}
			case FilterCondition.NotBetween: {
				const range = this.toRange(value);
				return Not(Between(range[0], range[1]));
			}
			default:
				return Equal(value);
		}
	}

	/**
	 * Builds the `404` error for a missing record.
	 * @param id - Identifier that was not found
	 * @returns The error to throw
	 */
	protected notFound(id: TId): AppError {
		const base = GlobalError.NotFoundError;
		return new AppError(
			HttpStatus.NOT_FOUND,
			new ClientError(String(base.code), `${this.entityType.name} with id ${String(id)} was not found.`)
		);
	}

	/**
	 * Rejects a field that is outside the supplied whitelist.
	 * @param field - Field requested by the client
	 * @param allowed - Whitelist for the operation
	 * @param operation - Operation name, used in the error message
	 * @throws AppError `4007` when the field is not allowed
	 */
	protected assertAllowedField(field: string, allowed: ReadonlySet<string>, operation: string): void {
		if (allowed.has(field)) {
			return;
		}

		const message = GlobalError.NotAllowedFieldError(field);
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			new ClientError(String(message.code), `${message.msg} (${operation})`)
		);
	}

	/**
	 * Narrows a filter value to a list.
	 * @param value - Filter value
	 * @returns The value as an array
	 */
	private toArray(value: FilterValue): Array<string | number | boolean> {
		return Array.isArray(value) ? value : [value];
	}

	/**
	 * Narrows a filter value to a single scalar, as required by range operators.
	 * @param value - Filter value
	 * @returns The first scalar of the value
	 * @throws AppError `4002` when the value is an empty array
	 */
	private toScalar(value: FilterValue): string | number | boolean {
		if (!Array.isArray(value)) {
			return value;
		}

		const first = value[0];

		if (first === undefined) {
			const message = GlobalError.TypeError('fieldValue', 'scalar');
			throw new AppError(HttpStatus.BAD_REQUEST, new ClientError(String(message.code), message.msg));
		}

		return first;
	}

	/**
	 * Narrows a filter value to exactly two scalars, as required by `BETWEEN`.
	 * @param value - Filter value
	 * @returns The two bounds
	 * @throws AppError `4002` when the value is not a two element array
	 */
	private toRange(value: FilterValue): [string | number | boolean, string | number | boolean] {
		if (!Array.isArray(value) || value.length !== 2) {
			const message = GlobalError.TypeError('fieldValue', 'two element array');
			throw new AppError(HttpStatus.BAD_REQUEST, new ClientError(String(message.code), message.msg));
		}

		return [value[0], value[1]];
	}
}
