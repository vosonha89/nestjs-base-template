import { Type } from '@nestjs/common';
import { ISeeder } from './seeder.interface';

/**
 * Injection token for the resolved {@link ISeeder} instances.
 *
 * Nest has no multi-provider syntax, so `seed.module.ts` builds the array with
 * a factory and exposes it under this token. `SeedService` then injects the
 * array without knowing how it was assembled.
 */
export const SEEDERS_TOKEN = Symbol('Seeders');

/**
 * Every seeder `SeedService` runs, in order.
 *
 * The template ships an empty list: a fresh app has no demo data, and forcing
 * one would mean shipping a seeding routine nobody asked for. `example/`
 * registers `UserSeeder` and `ProductSeeder` here.
 *
 * **This is an extension point, not template code** — it is excluded from
 * synchronisation on purpose.
 */
export const SEEDERS: Type<ISeeder>[] = [];
