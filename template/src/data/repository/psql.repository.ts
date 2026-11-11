import { EntityTarget, FindManyOptions, FindOptionsWhere, QueryDeepPartialEntity, Repository } from 'typeorm';
import { BaseEntity } from '@common/base/base.entity';
import { IBaseRepository } from '@common/base/base.repository';
import { ObjectHelper } from '@common/helper/object.helper';
import { PsqlContext } from '../context/psql.context';

/**
 * TypeORM implementation of {@link IBaseRepository}.
 *
 * Every concrete repository extends this class and only adds the queries that
 * are specific to its entity.
 * @template TEntity - Persisted entity type
 * @template TId - Type of the identifier field
 */
export abstract class PsqlRepository<TEntity extends BaseEntity<TId>, TId> implements IBaseRepository<TEntity, TId> {
	/** TypeORM repository bound to {@link TEntity}. */
	protected readonly repository: Repository<TEntity>;

	/**
	 * Constructor
	 * @param psqlContext - Persistence context owning the connection pool
	 * @param entityTarget - Entity class handled by this repository
	 */
	protected constructor(psqlContext: PsqlContext, entityTarget: EntityTarget<TEntity>) {
		this.repository = psqlContext.getRepository(entityTarget);
	}

	/**
	 * Creates an empty, non-persisted instance of the entity.
	 *
	 * Preferred over `new Entity()` because TypeORM applies column defaults and
	 * transformers, which a bare constructor does not.
	 * @returns A new entity instance
	 */
	public createEntity(): TEntity {
		return this.repository.create();
	}

	/**
	 * Finds one entity by primary key.
	 * @param id - Primary key value
	 * @returns The entity, or `null` when it does not exist
	 */
	public async findById(id: TId): Promise<TEntity | null> {
		return this.repository.findOne({ where: { id } as FindOptionsWhere<TEntity> });
	}

	/**
	 * Finds one entity matching the given condition.
	 * @param condition - TypeORM `where` clause
	 * @returns The entity, or `null` when it does not exist
	 */
	public async findOne(condition: FindOptionsWhere<TEntity>): Promise<TEntity | null> {
		return this.repository.findOne({ where: condition });
	}

	/**
	 * Finds every entity matching the given options.
	 * @param condition - Filtering, ordering and pagination options
	 * @returns Matching entities, empty array when none match
	 */
	public async find(condition?: FindManyOptions<TEntity>): Promise<TEntity[]> {
		return this.repository.find(condition);
	}

	/**
	 * Counts entities matching the given options.
	 * @param condition - Filtering options
	 * @returns Number of matching rows
	 */
	public async count(condition?: FindManyOptions<TEntity>): Promise<number> {
		return this.repository.count(condition);
	}

	/**
	 * Inserts or updates an entity.
	 *
	 * `@CreateDateColumn` and `@UpdateDateColumn` are filled by TypeORM, so
	 * callers never have to remember to set them.
	 * @param entity - Entity to persist
	 * @returns The persisted entity
	 */
	public async save(entity: TEntity): Promise<TEntity> {
		return this.repository.save(entity);
	}

	/**
	 * Updates the mutable columns of an existing entity.
	 * @param entity - Entity carrying the primary key and the new values
	 * @returns The updated entity
	 */
	public async update(entity: TEntity): Promise<TEntity> {
		// `updatedAt` is set explicitly because `Repository.update()` bypasses the
		// `@UpdateDateColumn` listener that `save()` relies on.
		const patch = ObjectHelper.compact(entity, ['id', 'createdAt', 'deletedAt']);
		patch['updatedAt'] = new Date();

		await this.repository.update(
			{ id: entity.id } as FindOptionsWhere<TEntity>,
			patch as unknown as QueryDeepPartialEntity<TEntity>
		);

		return entity;
	}

	/**
	 * Soft deletes an entity by primary key.
	 * @param id - Primary key value
	 * @returns `true` when a row was affected
	 */
	public async delete(id: TId): Promise<boolean> {
		const result = await this.repository.softDelete({ id } as FindOptionsWhere<TEntity>);
		return (result.affected ?? 0) > 0;
	}

	/**
	 * Checks existence by primary key.
	 * @param id - Primary key value
	 * @returns `true` when the row exists
	 */
	public async exists(id: TId): Promise<boolean> {
		return this.repository.exists({ where: { id } as FindOptionsWhere<TEntity> });
	}

	/**
	 * Checks existence by an arbitrary condition.
	 * @param condition - TypeORM `where` clause
	 * @returns `true` when at least one row matches
	 */
	public async existsBy(condition: FindOptionsWhere<TEntity>): Promise<boolean> {
		return this.repository.exists({ where: condition });
	}
}
