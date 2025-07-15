import {Repository, EntityTarget, FindOptionsWhere, FindManyOptions} from 'typeorm';
import {IBaseRepository} from 'src/core/domain/common/base/base.repository';
import {AnyType} from 'src/core/domain/common/base/base.type';
import {PsqlContext} from "./psqlContext";
import {BaseEntity} from "../../../core/domain/common/base/base.entity";

/**
 * PostgresQL repository implementation
 * Extends the BaseRepository interface to provide PostgresQL specific implementation
 */
export abstract class PsqlRepository<T extends BaseEntity<ID>, ID> implements IBaseRepository<T, ID> {
    protected repository: Repository<T>;

    constructor(
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
        const condition = {id} as unknown as FindOptionsWhere<T>;
        return this.repository.findOne({where: condition});
    }

    /**
     * Find all entities
     */
    async findAll(): Promise<T[]> {
        return this.repository.find();
    }

    /**
     * Find entities with conditions
     * @param condition
     */
    async find(condition: FindManyOptions<T> | undefined): Promise<T[]> {
        return this.repository.find(condition);
    }

    /**
     * Save entity
     * @param entity Entity to save
     */
    async save(entity: T): Promise<T> {
        return this.repository.save(entity);
    }

    /**
     * Update entity
     * @param entity Entity to update
     */
    async update(entity: T): Promise<T> {
        await this.repository.update(entity.id as unknown as AnyType, entity as AnyType);
        return entity;
    }

    /**
     * Delete entity by id
     * @param id Entity id
     */
    async delete(id: ID): Promise<boolean> {
        const result = await this.repository.delete(id as unknown as AnyType);
        return result.affected !== 0;
    }

    /**
     * Check if entity exists by id
     * @param id Entity id
     */
    async exists(id: ID): Promise<boolean> {
        const condition = {id} as unknown as FindOptionsWhere<T>;
        const count = await this.repository.count({where: condition});
        return count > 0;
    }
}
