import { Repository, EntityTarget, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { IBaseRepository } from 'src/core/domain/common/base/base.repository';
import { PsqlContext } from "./psqlContext";
import { BaseEntity } from "../../../core/domain/common/base/base.entity";

/**
 * PostgresQL repository implementation
 * Extends the BaseRepository interface to provide PostgresQL specific implementation
 */
export abstract class PsqlRepository<T extends BaseEntity<ID>, ID> implements IBaseRepository<T, ID> {
    protected repository: Repository<T>;

    protected constructor(
        protected readonly psqlContext: PsqlContext,
        protected readonly entityTarget: EntityTarget<T>
    ) {
        this.repository = this.psqlContext.getDataSource().getRepository(entityTarget);
    }

    /**
     * Find entity by id
     * @param id Entity id
     */
    async findById(id: ID): Promise<T | null> {
        const condition = { id } as FindOptionsWhere<T>;
        return this.repository.findOne({ where: condition });
    }

    /**
     * Find entity by condition
     * @param condition Entity condition
     */
    async findOne(condition: FindOptionsWhere<T> | undefined): Promise<T | null> {
        return this.repository.findOne({ where: condition });
    }

    /**
     * Find entities with conditions
     * @param condition
     */
    async find(condition: FindManyOptions<T> | undefined): Promise<T[]> {
        return this.repository.find(condition);
    }

	/**
	 * Count entities with conditions
	 * @param condition
	 */
	count(condition: FindManyOptions<T> | undefined): Promise<number> {
		return this.repository.count(condition);
	}

    /**
     * Save entity
     * @param entity Entity to save
     */
    async save(entity: T): Promise<T> {
		entity.createdAt = new Date();
        return this.repository.save(entity);
    }

    /**
     * Update entity
     * @param entity Entity to update
     */
    async update(entity: T): Promise<T> {
        const id = entity.id;
        const condition = { id } as FindOptionsWhere<T>;
        entity.updatedAt = new Date();

        // Create a plain object with only the fields we want to update
        const updateData: QueryDeepPartialEntity<T> = {} as QueryDeepPartialEntity<T>;
        Object.keys(entity).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                (updateData as any)[key] = (entity as any)[key];
            }
        });

        await this.repository.update(condition, updateData);
        return entity;
    }

    /**
     * Delete entity by id
     * @param id Entity id
     */
    async delete(id: ID): Promise<boolean> {
        const condition = { id } as FindOptionsWhere<T>;
        const result = await this.repository.delete(condition);
        return result.affected !== 0;
    }

    /**
     * Check if entity exists by id
     * @param id Entity id
     */
    async exists(id: ID): Promise<boolean> {
        const condition = { id } as FindOptionsWhere<T>;
        const count = await this.repository.count({ where: condition });
        return count > 0;
    }

    /**
     * Check if entity exists by condition
     * @param condition Entity condition
     */
    async existsBy(condition: FindOptionsWhere<T> | undefined): Promise<boolean> {
        const count = await this.repository.count({ where: condition });
        return count > 0;
    }
}
