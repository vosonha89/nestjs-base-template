import { BaseType } from "./base.type";
import { FindManyOptions, FindOptionsWhere } from "typeorm";

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
    findById(id: ID): Promise<T | null>;

    /**
     * Retrieves entities that match the specified criteria
     * @param condition Object containing search parameters
     * @param skip Number of records to skip
     * @param take Maximum number of records to return
     * @returns A promise that resolves to an array of matching entities
     */
    findBy(condition: FindManyOptions<T> | undefined, skip?: number, take?: number): Promise<T[]>;

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
     * Deletes an entity from the system
     * @param id The unique identifier of the entity to delete
     * @returns A promise that resolves to a boolean indicating success
     */
    delete(id: ID): Promise<boolean>;

    /**
     * Determines if an entity with the specified ID exists
     * @param id The unique identifier to check
     * @returns A promise that resolves to a boolean indicating existence
     */
    exists(id: ID): Promise<boolean>;

    /**
     * Determines if an entity with the specified condition exists
     * @param condition Optional filter criteria
     * @returns A promise that resolves to a boolean indicating existence
     */
    existsBy(condition: FindOptionsWhere<T> | undefined): Promise<boolean>;
}