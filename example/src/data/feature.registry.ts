import { InjectionToken, Provider } from '@nestjs/common';
import { EntitySchema } from 'typeorm';
import { ProductEntity } from './entity/product.entity';
import { UserEntity } from './entity/user.entity';
import { ProductRepository, ProductRepositorySymbol } from './repository/product.repository';
import { UserRepository, UserRepositorySymbol } from './repository/user.repository';

/**
 * The forms TypeORM accepts in `DataSourceOptions.entities`.
 *
 * Spelled out instead of reusing `EntityTarget`, because `EntityTarget` also
 * includes the `{ type, name }` literal form which TypeORM rejects here.
 */
export type RegisteredEntity = string | EntitySchema | (new (...args: never[]) => object);

/**
 * Every entity TypeORM must map.
 *
 * This is the only part of the data layer the example owns: `template/` ships
 * the identical file with an empty array. `npm run verify:sync` treats it as a
 * declared divergence, so it is never overwritten.
 */
export const ENTITIES: RegisteredEntity[] = [UserEntity, ProductEntity];

/**
 * Repository providers registered in the data module.
 */
export const REPOSITORY_PROVIDERS: Provider[] = [
	{ provide: UserRepositorySymbol, useClass: UserRepository },
	{ provide: ProductRepositorySymbol, useClass: ProductRepository }
];

/**
 * Injection tokens the data module exports to the rest of the application.
 *
 * Typed as `InjectionToken` rather than `Provider` because a `Symbol` is a
 * valid export but not a provider.
 */
export const REPOSITORY_EXPORTS: InjectionToken[] = [UserRepositorySymbol, ProductRepositorySymbol];
