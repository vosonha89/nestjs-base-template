import {AnyType} from "./base.type";

export interface IBaseRepository<T, ID> {
    /**
     * Find entity by id
     * @param id Entity id
     */
    findById(id: ID): Promise<T | null>;

    /**
     * Find all entities
     */
    findAll(): Promise<T[]>;

    /**
     * Find entities by condition
     */
    find(condition: AnyType): Promise<T[]>;

    /**
     * Save entity
     * @param entity Entity to save
     */
    save(entity: T): Promise<T>;

    /**
     * Update entity
     * @param entity Entity to update
     */
    update(entity: T): Promise<T>;

    /**
     * Delete entity by id
     * @param id Entity id
     */
    delete(id: ID): Promise<boolean>;

    /**
     * Check if entity exists by id
     * @param id Entity id
     */
    exists(id: ID): Promise<boolean>;
}