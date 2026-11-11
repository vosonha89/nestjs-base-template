import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';
import { IDbConfig } from '@config/config.type';
import { ENTITIES } from './feature.registry';

export { ENTITIES };

/**
 * Builds the TypeORM options from the validated configuration.
 *
 * Shared by the Nest module and the CLI data source, which guarantees that
 * `migration:run` talks to exactly the same database the application uses.
 *
 * `synchronize` is hard-coded to `false`: schema changes only ever happen
 * through migrations. The original template had `synchronize: env === 'production'`,
 * which is precisely backwards and could drop production data.
 * @param config - Validated database configuration
 * @returns The options TypeORM needs
 */
export function buildDataSourceOptions(config: IDbConfig): DataSourceOptions {
	return {
		type: 'postgres',
		host: config.host,
		port: config.port,
		username: config.username,
		password: config.password,
		database: config.database,
		ssl: config.ssl ? { rejectUnauthorized: config.sslRejectUnauthorized } : false,
		entities: ENTITIES,
		migrations: [join(__dirname, 'migration', '*.{ts,js}')],
		migrationsTableName: 'migration',
		synchronize: false,
		logging: config.logging ? ['query', 'error', 'schema'] : ['error'],
		extra: {
			max: config.poolSize,
			application_name: config.applicationName
		}
	};
}
