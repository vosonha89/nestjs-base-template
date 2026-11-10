import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IDbConfig } from '@config/config.type';
import { PsqlContext, PsqlContextSymbol } from './context/psql.context';
import { buildDataSourceOptions } from './data-source-options';
import { ProductRepository, ProductRepositorySymbol } from './repository/product.repository';
import { UserRepository, UserRepositorySymbol } from './repository/user.repository';

/**
 * Owns the database connection and exposes every repository.
 *
 * Registered as `@Global()` so feature modules do not import it explicitly and
 * so a repository is never instantiated twice. Connection creation, retry and
 * graceful shutdown are delegated to `TypeOrmModule.forRootAsync`; the previous
 * hand rolled `useFactory` + `new PsqlContext()` skipped the Nest lifecycle and
 * initialised the pool twice.
 */
@Global()
@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const config = configService.getOrThrow<IDbConfig>('db');

				return {
					...buildDataSourceOptions(config),
					// Connection retry lives on `TypeOrmModuleOptions`, not on
					// `DataSourceOptions`, so it is added here rather than in the
					// shared builder (the CLI has no use for it).
					retryAttempts: config.retryAttempts,
					retryDelay: config.retryDelay
				};
			}
		})
	],
	providers: [
		{ provide: PsqlContextSymbol, useClass: PsqlContext },
		{ provide: UserRepositorySymbol, useClass: UserRepository },
		{ provide: ProductRepositorySymbol, useClass: ProductRepository }
	],
	exports: [PsqlContextSymbol, UserRepositorySymbol, ProductRepositorySymbol]
})
export class DataModule {}
