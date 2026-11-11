import { Type } from '@nestjs/common';
import { AuthModule } from './api/v1/auth/auth.module';
import { ProductModule } from './api/v1/product/product.module';
import { UserModule } from './api/v1/user/user.module';

/**
 * A Nest module that exposes one feature's HTTP surface.
 */
export type FeatureModule = Type<unknown>;

/**
 * Every feature module mounted on the HTTP layer.
 *
 * This is the only part of the HTTP layer the example owns: `template/` ships
 * the identical file with an empty array.
 */
export const FEATURE_MODULES: FeatureModule[] = [AuthModule, UserModule, ProductModule];

/**
 * Swagger tag names, in the order they appear in the UI.
 */
export const SWAGGER_TAGS: string[] = ['auth', 'user', 'product', 'health'];
