import { Inject, Injectable } from '@nestjs/common';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { SEEDERS_TOKEN } from './seed.registry';
import { ISeeder } from './seeder.interface';

/**
 * Runs every registered {@link ISeeder} in order.
 *
 * The orchestration loop lives here; the data lives in the individual seeders,
 * which are contributed through `seed.registry.ts`. That split is what lets a
 * new app add seed data without editing this class — and why this file stays
 * identical between `template/` and `example/`.
 */
@Injectable()
export class SeedService {
	/**
	 * Constructor
	 * @param loggingService - Structured logger
	 * @param seeders - Seeder instances resolved from the registry
	 */
	public constructor(
		@Inject(LoggingServiceSymbol) private readonly loggingService: ILoggingService,
		@Inject(SEEDERS_TOKEN) private readonly seeders: readonly ISeeder[]
	) {}

	/**
	 * Runs every registered seeder.
	 *
	 * Stops at the first failure on purpose: a half seeded database is easier to
	 * diagnose than a silently skipped one.
	 * @returns Resolves once every seeder has completed
	 */
	public async run(): Promise<void> {
		if (this.seeders.length === 0) {
			this.loggingService.info('No seeders registered — nothing to do.', 'SeedService');
			return;
		}

		for (const seeder of this.seeders) {
			this.loggingService.info(`Running ${seeder.name}`, 'SeedService');
			await seeder.run();
		}
	}
}
