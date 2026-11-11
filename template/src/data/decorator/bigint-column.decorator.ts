import { Column, ColumnOptions, PrimaryColumn, PrimaryColumnOptions } from 'typeorm';

/**
 * Converts a JS number into the representation `pg` expects for `bigint`.
 * @param value - Value supplied by the application
 * @returns The same value
 */
const toDriver = (value: number | null | undefined): number | null | undefined => value;

/**
 * Converts a `bigint` returned by `pg` into a JS number.
 *
 * `node-postgres` returns `bigint` as a string because it may exceed
 * `Number.MAX_SAFE_INTEGER`. Identifiers in this application stay far below
 * that bound, so the conversion is safe — but keep it in mind if a table ever
 * grows past 9e15 rows.
 * @param value - Value returned by the driver
 * @returns The parsed number, or `null`
 */
const fromDriver = (value: string | null | undefined): number | null => {
	if (value === null || value === undefined) {
		return null;
	}

	return Number.parseInt(value, 10);
};

/**
 * Value transformer applied to every `numeric` column so the application works
 * with numbers while Postgres keeps exact fixed point storage.
 */
export const numericTransformer = {
	/** Serialises a number for the driver. */
	to: (value: number | null | undefined): number | null | undefined => value,
	/** Parses the driver's decimal string. */
	from: (value: string | null | undefined): number | null => {
		if (value === null || value === undefined) {
			return null;
		}

		return Number.parseFloat(value);
	}
};

/**
 * Declares a `bigint` column exposed as a JS number.
 *
 * Replaces the `{ ... } as any` casts the original template needed at every
 * call site.
 * @param options - Extra TypeORM column options, merged on top of the defaults
 * @returns The property decorator
 */
export const BigIntColumn = (options: ColumnOptions = {}): PropertyDecorator =>
	Column({
		type: 'bigint',
		...options,
		transformer: { to: toDriver, from: fromDriver }
	});

/**
 * Declares an auto-incrementing `bigint` primary key exposed as a JS number.
 *
 * Uses `@PrimaryColumn({ generated: 'increment' })` rather than
 * `@PrimaryGeneratedColumn` because the latter's option type does not accept a
 * value transformer.
 * @param options - Extra TypeORM column options, merged on top of the defaults
 * @returns The property decorator
 */
export const BigIntPrimaryColumn = (options: PrimaryColumnOptions = {}): PropertyDecorator =>
	PrimaryColumn({
		type: 'bigint',
		generated: 'increment',
		...options,
		transformer: { to: toDriver, from: fromDriver }
	});
