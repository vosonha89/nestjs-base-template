import { CustomDecorator, SetMetadata } from '@nestjs/common';

/**
 * Metadata key read by {@link RolesGuard}.
 */
export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the supplied roles.
 *
 * Enforced by `RolesGuard`, which runs after `JwtAuthGuard` so the principal is
 * already resolved.
 * @param roles - Roles allowed to reach the endpoint
 * @returns The metadata decorator
 * @example
 * @Roles('admin')
 */
export const Roles = (...roles: string[]): CustomDecorator<string> => SetMetadata(ROLES_KEY, roles);
