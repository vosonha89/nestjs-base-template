import { CustomDecorator, SetMetadata } from '@nestjs/common';

/**
 * Metadata key read by {@link JwtAuthGuard} to skip authentication.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route or controller as reachable without a JWT.
 *
 * The guard is registered globally, so every endpoint is protected unless it
 * is explicitly opted out — the safe default.
 * @returns The metadata decorator
 */
export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);
