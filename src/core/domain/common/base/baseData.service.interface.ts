import { BaseType } from "./base.type";
import { BaseFilter, BaseFilterWhere, BaseSort } from "./base.request";

/**
 * Base service interface defining common CRUD operations.
 * This interface serves as a contract for service implementations
 * to ensure consistent data management operations across the application.
 *
 * @template T - The entity type this service operates on
 * @template ID - The type of the entity's unique identifier
 */
export interface IBaseDataService<T extends BaseType<ID>, ID> {
	/**
	 * Retrieves an entity by its unique identifier
	 * @param id The unique identifier of the entity
	 * @returns A promise that resolves to the found entity or null if not found
	 */
	findById(id: ID): Promise<T | undefined>;

	/**
	 * Finds and retrieves data based on the specified filters, sort options, and pagination settings.
	 *
	 * @param {BaseFilter[]} filters - An array of filter conditions to filter the data.
	 * @param {BaseSort} sort - Sorting options to order the results.
	 * @param {number} [skip] - The number of records to skip for pagination.
	 * @param {number} [take] - The number of records to retrieve for pagination.
	 * @param {boolean} [count] - Indicates whether to count the total number of records available.
	 * @return {Promise<{data: T[], totalRecord: number}>} A promise resolving to an array containing the filtered data and the total record count.
	 */
	findBy(filters: BaseFilter[], sort: BaseSort, skip?: number, take?: number, count?: boolean): Promise<{
		data: T[],
		totalRecord: number
	}>;

	/**
	 * Creates a new entity in the system
	 * @param data Partial entity data for creation
	 * @returns A promise that resolves to the created entity
	 */
	create(data: Partial<T>): Promise<T>;

	/**
	 * Updates an existing entity
	 * @param id The unique identifier of the entity to update
	 * @param data The partial entity data to update
	 * @returns A promise that resolves to the updated entity
	 */
	update(id: ID, data: Partial<T>): Promise<T>;

	/**
	 * Deletes an entity identified by its unique ID.
	 * @param {ID} id - The unique identifier of the entity to be deleted.
	 * @return {Promise<boolean | void>} A promise that resolves to `true` if the deletion was successful `void` if there was no entity to delete, or rejects with an error.
	 */
	delete(id: ID): Promise<boolean | void>;

	/**
	 * Determines if an entity with the specified ID exists
	 * @param id The unique identifier to check
	 * @returns A promise that resolves to a boolean indicating existence
	 */
	exists(id: ID): Promise<boolean>;

	/**
	 * Checks for the existence of an entity based on the provided filters.
	 *
	 * @param {BaseFilterWhere[]} filters - An array of filter objects used to determine the entity's existence.
	 * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the entity exists.
	 */
	existsBy(filters: BaseFilterWhere[]): Promise<boolean>;
}
