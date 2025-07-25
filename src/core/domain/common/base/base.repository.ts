import { AnyType } from "./base.type";
import { FindOptionsWhere } from "typeorm";
import { BaseEntity } from "./base.entity";

export interface IBaseRepository<T extends BaseEntity<ID>, ID> {
    /**
     * Find entity by id
     * @param id Entity id
     */
    findById(id: ID): Promise<T | null>;

    /**
     * Find entities by condition
     */
    find(condition: AnyType): Promise<T[]>;

	/**
	 * Count entities by condition
	 */
	count(condition: AnyType): Promise<number>;

    /**
     * Save entity
     * @param entity Entity to save
     */
    save(entity: Partial<T>): Promise<T>;

    /**
     * Update entity
     * @param entity Entity to update
     */
    update(entity: Partial<T>): Promise<T>;

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

    /**
     * Check if entity exists by condition
     * @param condition Entity condition
     */
    existsBy(condition: FindOptionsWhere<T> | undefined): Promise<boolean>;
}
