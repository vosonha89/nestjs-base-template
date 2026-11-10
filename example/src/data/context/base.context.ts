import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';

/**
 * Storage agnostic handle on a persistence context.
 *
 * Keeps `PsqlRepository` from depending on `@nestjs/typeorm` directly, so a
 * second engine (Mongo, Spanner…) can be added without touching the
 * repositories that already exist.
 */
export abstract class BaseContext {
	/**
	 * Indicates whether the underlying connection pool is usable.
	 * @returns `true` when queries may be issued
	 */
	public abstract isReady(): boolean;

	/**
	 * Returns the repository bound to an entity.
	 * @param target - Entity class
	 * @returns The repository for that entity
	 */
	public abstract getRepository<TEntity extends ObjectLiteral>(target: EntityTarget<TEntity>): Repository<TEntity>;
}
