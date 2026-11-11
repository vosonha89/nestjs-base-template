import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { BaseContext } from './base.context';

/**
 * Service symbol for DI register
 */
export const PsqlContextSymbol = Symbol('PsqlContext');

/**
 * PostgreSQL implementation of {@link BaseContext}.
 *
 * A thin facade over the `DataSource` that `TypeOrmModule.forRootAsync` owns.
 * Connection creation, retry and graceful shutdown are handled by Nest, so this
 * class no longer needs the manual `initialize()`/`disconnect()` lifecycle the
 * original template carried (which also double-initialised the pool).
 */
@Injectable()
export class PsqlContext extends BaseContext {
	/**
	 * Constructor
	 * @param dataSource - Connection pool managed by `@nestjs/typeorm`
	 */
	public constructor(@InjectDataSource() private readonly dataSource: DataSource) {
		super();
	}

	/**
	 * Indicates whether the pool has finished initialising.
	 * @returns `true` when queries may be issued
	 */
	public isReady(): boolean {
		return this.dataSource.isInitialized;
	}

	/**
	 * Returns the repository bound to an entity.
	 * @param target - Entity class
	 * @returns The repository for that entity
	 * @throws Error when the pool is not ready yet
	 */
	public getRepository<TEntity extends ObjectLiteral>(target: EntityTarget<TEntity>): Repository<TEntity> {
		if (!this.dataSource.isInitialized) {
			throw new Error('Database connection is not initialised yet.');
		}

		return this.dataSource.getRepository(target);
	}

	/**
	 * Exposes the raw `DataSource`.
	 *
	 * Needed for explicit transaction handling (`DataSource.transaction`), which
	 * lives in the service layer rather than in a repository.
	 * @returns The underlying data source
	 */
	public getDataSource(): DataSource {
		return this.dataSource;
	}
}
