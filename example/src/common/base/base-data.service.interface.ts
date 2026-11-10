import { BaseFilter, BaseFilterWhere, BaseSort } from './base.request';
import { BaseType, Paginated } from './base.type';

/**
 * CRUD contract implemented by every data service.
 *
 * The controller layer depends on this interface, never on a concrete service,
 * which is what makes swapping an implementation (or mocking it in a test)
 * a one line change.
 * @template TDto - DTO exposed by the service
 * @template TId - Type of the identifier field
 */
export interface IBaseDataService<TDto extends BaseType<TId>, TId> {
	/**
	 * Retrieves one record by identifier.
	 * @param id - Identifier of the record
	 * @returns The DTO, or `undefined` when the record does not exist
	 */
	findById(id: TId): Promise<TDto | undefined>;

	/**
	 * Retrieves a page of records.
	 * @param filters - Filter clauses, AND-ed together
	 * @param sort - Ordering clause, falls back to the service default
	 * @param skip - Number of records to skip
	 * @param take - Maximum number of records to return
	 * @param count - When `true`, `totalRecord` is populated with a separate count query
	 * @returns The page content and, optionally, the total record count
	 */
	findBy(
		filters: BaseFilter[],
		sort?: BaseSort,
		skip?: number,
		take?: number,
		count?: boolean
	): Promise<Paginated<TDto>>;

	/**
	 * Creates a record.
	 * @param data - Fields of the new record
	 * @returns The created DTO
	 */
	create(data: Partial<TDto>): Promise<TDto>;

	/**
	 * Updates a record.
	 * @param id - Identifier of the record
	 * @param data - Fields to change, `undefined` values are ignored
	 * @returns The updated DTO
	 */
	update(id: TId, data: Partial<TDto>): Promise<TDto>;

	/**
	 * Soft deletes a record.
	 * @param id - Identifier of the record
	 * @returns `true` when a record was deleted
	 */
	delete(id: TId): Promise<boolean>;

	/**
	 * Checks existence by identifier.
	 * @param id - Identifier of the record
	 * @returns `true` when the record exists
	 */
	exists(id: TId): Promise<boolean>;

	/**
	 * Checks existence by equality clauses.
	 * @param filters - Equality clauses, AND-ed together
	 * @returns `true` when at least one record matches
	 */
	existsBy(filters: BaseFilterWhere[]): Promise<boolean>;
}
