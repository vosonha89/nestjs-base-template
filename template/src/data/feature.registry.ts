import { InjectionToken, Provider } from '@nestjs/common';
import { EntitySchema } from 'typeorm';

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
 * Declared explicitly instead of with a glob so a bundler cannot drop one and
 * so TypeORM fails loudly when a new entity is forgotten here.
 *
 * **This is an extension point, not template code.** A new app replaces the
 * array below with its own entities — or, better, lets
 * `npm run generate:feature` append to it. That is the only reason this file
 * is excluded from `template` ⇄ `example` synchronisation.
 */
export const ENTITIES: RegisteredEntity[] = [];

/**
 * Repository providers registered in the data module.
 *
 * A new app adds one entry per repository:
 * `{ provide: OrderRepositorySymbol, useClass: OrderRepository }`.
 */
export const REPOSITORY_PROVIDERS: Provider[] = [];

/**
 * Injection tokens the data module exports to the rest of the application.
 *
 * Almost always the symbols declared in {@link REPOSITORY_PROVIDERS}. Typed as
 * `InjectionToken` rather than `Provider` because a `Symbol` is a valid export
 * but not a provider.
 */
export const REPOSITORY_EXPORTS: InjectionToken[] = [];
