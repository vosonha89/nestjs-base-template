import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Storage agnostic data access contract.
 *
 * Services depend on this interface, never on TypeORM directly, which keeps the
 * business layer testable without a database and leaves room for a second
 * storage engine (Mongo, Redis, an HTTP client…) behind the same port.
 * @template TEntity - Persisted entity type
 * @template TId - Type of the identifier field
 */
export interface IBaseRepository<TEntity extends BaseEntity<TId>, TId> {
	/**
	 * Finds one entity by primary key.
	 * @param id - Primary key value
	 * @returns The entity, or `null` when it does not exist
	 */
	findById(id: TId): Promise<TEntity | null>;

	/**
	 * Finds one entity matching the given condition.
	 * @param condition - TypeORM `where` clause
	 * @returns The entity, or `null` when it does not exist
	 */
	findOne(condition: FindOptionsWhere<TEntity>): Promise<TEntity | null>;

	/**
	 * Finds every entity matching the given options.
	 * @param condition - Filtering, ordering and pagination options
	 * @returns Matching entities, empty array when none match
	 */
	find(condition?: FindManyOptions<TEntity>): Promise<TEntity[]>;

	/**
	 * Counts entities matching the given options.
	 * @param condition - Filtering options, `take`/`skip` are ignored
	 * @returns Number of matching rows
	 */
	count(condition?: FindManyOptions<TEntity>): Promise<number>;

	/**
	 * Inserts or updates an entity.
	 * @param entity - Entity to persist
	 * @returns The persisted entity
	 */
	save(entity: TEntity): Promise<TEntity>;

	/**
	 * Updates the mutable columns of an existing entity.
	 * @param entity - Entity carrying the primary key and the new values
	 * @returns The updated entity
	 */
	update(entity: TEntity): Promise<TEntity>;

	/**
	 * Soft deletes an entity by primary key.
	 * @param id - Primary key value
	 * @returns `true` when a row was affected
	 */
	delete(id: TId): Promise<boolean>;

	/**
	 * Checks existence by primary key.
	 * @param id - Primary key value
	 * @returns `true` when the row exists
	 */
	exists(id: TId): Promise<boolean>;

	/**
	 * Checks existence by an arbitrary condition.
	 * @param condition - TypeORM `where` clause
	 * @returns `true` when at least one row matches
	 */
	existsBy(condition: FindOptionsWhere<TEntity>): Promise<boolean>;
}
