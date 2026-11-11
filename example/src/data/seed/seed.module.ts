import { Module } from '@nestjs/common';
import { AppConfigModule } from '@config/app-config.module';
import { CommonModule } from '@common/common.module';
import { DataModule } from '@data/database.module';
import { SEEDERS, SEEDERS_TOKEN } from './seed.registry';
import { SeedService } from './seed.service';
import { ISeeder } from './seeder.interface';

/**
 * Minimal context for the seed command.
 *
 * Imports only what the seeder needs — configuration, cross-cutting services
 * and data access — so `npm run seed` does not boot the HTTP layer.
 *
 * `SeedService` receives its seeders through {@link SEEDERS_TOKEN}, which is
 * built here with a factory because Nest has no multi-provider syntax. An empty
 * registry produces an empty array and the command logs "nothing to do".
 */
@Module({
	imports: [AppConfigModule, CommonModule, DataModule],
	providers: [
		...SEEDERS,
		{
			provide: SEEDERS_TOKEN,
			useFactory: (...instances: ISeeder[]): ISeeder[] => instances,
			inject: SEEDERS
		},
		SeedService
	]
})
export class SeedModule {}
