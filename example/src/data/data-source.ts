import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { dbConfig } from '@config/configuration';
import { buildDataSourceOptions } from './data-source-options';

/**
 * Standalone data source used exclusively by the TypeORM CLI.
 *
 * The Nest application builds its own connection through
 * `DataModule` + `TypeOrmModule.forRootAsync`; this file exists so that
 * `migration:generate`, `migration:run` and `migration:revert` can reach the
 * same database with the same options.
 *
 * The env file is loaded here because the CLI has no Nest bootstrap to do it.
 */
const environment = process.env.NODE_ENV ?? 'development';

loadEnv({ path: join(process.cwd(), 'env', `.env.${environment}`) });

/**
 * The data source instance the CLI operates on.
 */
const dataSource = new DataSource(buildDataSourceOptions(dbConfig()));

export default dataSource;
