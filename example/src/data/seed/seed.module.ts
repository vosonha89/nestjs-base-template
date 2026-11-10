import { Module } from '@nestjs/common';
import { AppConfigModule } from '@config/app-config.module';
import { CommonModule } from '@common/common.module';
import { DataModule } from '@data/database.module';
import { SeedService } from './seed.service';

/**
 * Minimal context for the seed command.
 *
 * Imports only what the seeder needs — configuration, cross-cutting services
 * and data access — so `npm run seed` does not boot the HTTP layer.
 */
@Module({
	imports: [AppConfigModule, CommonModule, DataModule],
	providers: [SeedService]
})
export class SeedModule {}
