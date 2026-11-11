import { Module } from '@nestjs/common';
import { HealthModule } from './api/v1/health/health.module';
import { FEATURE_MODULES } from './feature.registry';

/**
 * Single entry point for the HTTP layer.
 *
 * Feature modules are imported from {@link FEATURE_MODULES} rather than being
 * listed inline. Adding a feature therefore means appending one entry to
 * `feature.registry.ts`, which keeps this file identical between `template/`
 * and `example/` so the two can be kept in sync.
 */
@Module({
	imports: [...FEATURE_MODULES, HealthModule]
})
export class PresentationModule {}
