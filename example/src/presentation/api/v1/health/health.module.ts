import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Provides the health probe endpoints.
 */
@Module({
	imports: [TerminusModule],
	controllers: [HealthController]
})
export class HealthModule {}
