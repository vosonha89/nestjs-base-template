import { Type } from '@nestjs/common';

/**
 * A Nest module that exposes one feature's HTTP surface.
 */
export type FeatureModule = Type<unknown>;

/**
 * Every feature module mounted on the HTTP layer.
 *
 * `PresentationModule` imports this array, so adding a feature means appending
 * one entry here instead of editing the module decorator. Keeping the wiring in
 * a single place is what allows `template` and `example` to share an identical
 * `presentation.module.ts`.
 *
 * **This is an extension point, not template code** — it is excluded from
 * synchronisation on purpose.
 */
export const FEATURE_MODULES: FeatureModule[] = [];

/**
 * Swagger tag names, in the order they appear in the UI.
 *
 * `main.ts` iterates this array instead of chaining a hard-coded `.addTag(...)`
 * per feature, so a new tag never requires touching the bootstrap.
 */
export const SWAGGER_TAGS: string[] = ['health'];
