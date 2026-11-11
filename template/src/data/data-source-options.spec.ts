import { join } from 'node:path';
import { IDbConfig } from '@config/config.type';
import { buildDataSourceOptions } from './data-source-options';
import { ENTITIES } from './feature.registry';

/**
 * The subset of the Postgres driver options this suite asserts on.
 *
 * Declared locally instead of importing `PostgresDataSourceOptions`: the
 * package's `exports` map only exposes the root entry point, and a deep import
 * would be both fragile across TypeORM majors and invisible to the type checker
 * under `moduleResolution: node10`.
 */
interface IPostgresOptions {
	readonly type: string;
	readonly host?: string;
	readonly port?: number;
	readonly username?: string;
	readonly database?: string;
	readonly ssl?: unknown;
	readonly logging?: unknown;
	readonly entities?: unknown;
	readonly migrations?: unknown;
	readonly migrationsTableName?: string;
	readonly synchronize?: boolean;
	readonly extra?: unknown;
}

/**
 * Narrows the shared builder result to the Postgres variant.
 * @param config - Resolved database configuration
 * @returns The options as a Postgres options object
 */
function postgresOptions(config: IDbConfig): IPostgresOptions {
	return buildDataSourceOptions(config) as unknown as IPostgresOptions;
}

/**
 * Builds a resolved database configuration fixture.
 * @param overrides - Fields to replace
 * @returns The fixture
 */
function dbConfig(overrides: Partial<IDbConfig> = {}): IDbConfig {
	return {
		host: 'localhost',
		port: 5432,
		username: 'postgres',
		password: 'postgres',
		database: 'app',
		applicationName: 'test-app',
		ssl: false,
		sslRejectUnauthorized: true,
		logging: false,
		synchronize: false,
		retryAttempts: 10,
		retryDelay: 3000,
		poolSize: 10,
		...overrides
	};
}

describe('buildDataSourceOptions', () => {
	it('should map every connection field onto the driver options', () => {
		const options = postgresOptions(dbConfig({ host: 'db.internal', port: 6543, database: 'shop' }));

		expect(options.type).toEqual('postgres');
		expect(options.host).toEqual('db.internal');
		expect(options.port).toEqual(6543);
		expect(options.database).toEqual('shop');
		expect(options.username).toEqual('postgres');
	});

	it('should always disable synchronize', () => {
		// Even a config that lies about it must not enable schema synchronisation.
		expect(postgresOptions(dbConfig({ synchronize: true })).synchronize).toBe(false);
	});

	it('should leave TLS off for a local connection', () => {
		expect(postgresOptions(dbConfig({ ssl: false })).ssl).toBe(false);
	});

	it('should honour the certificate validation flag when TLS is on', () => {
		expect(postgresOptions(dbConfig({ ssl: true, sslRejectUnauthorized: true })).ssl).toEqual({
			rejectUnauthorized: true
		});
		expect(postgresOptions(dbConfig({ ssl: true, sslRejectUnauthorized: false })).ssl).toEqual({
			rejectUnauthorized: false
		});
	});

	it('should log queries only when explicitly asked to', () => {
		expect(postgresOptions(dbConfig({ logging: false })).logging).toEqual(['error']);
		expect(postgresOptions(dbConfig({ logging: true })).logging).toEqual(['query', 'error', 'schema']);
	});

	it('should use the registry entities and the migration folder', () => {
		const options = postgresOptions(dbConfig());

		expect(options.entities).toBe(ENTITIES);
		expect(options.migrations).toEqual([join(__dirname, 'migration', '*.{ts,js}')]);
		expect(options.migrationsTableName).toEqual('migration');
	});

	it('should size the pool from the configuration', () => {
		expect(postgresOptions(dbConfig({ poolSize: 25 })).extra).toMatchObject({ max: 25 });
	});

	it('should report the application name to Postgres', () => {
		expect(postgresOptions(dbConfig({ applicationName: 'order-api' })).extra).toMatchObject({
			application_name: 'order-api'
		});
	});
});
