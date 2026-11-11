import { Type } from '@nestjs/common';
import { ProductSeeder } from './seeder/product.seeder';
import { UserSeeder } from './seeder/user.seeder';
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
 * This is the only part of the seed layer the example owns: `template/` ships
 * the identical file with an empty array.
 */
export const SEEDERS: Type<ISeeder>[] = [UserSeeder, ProductSeeder];
