import { Module } from '@nestjs/common';
import { AuthModule } from './api/v1/auth/auth.module';
import { HealthModule } from './api/v1/health/health.module';
import { ProductModule } from './api/v1/product/product.module';
import { UserModule } from './api/v1/user/user.module';

/**
 * Single entry point for the HTTP layer.
 *
 * Adding a feature means creating its module under `api/v1/<feature>/` and
 * appending it to the `imports` array below — nothing else changes.
 */
@Module({
	imports: [AuthModule, UserModule, ProductModule, HealthModule]
})
export class PresentationModule {}
