/**
 * Contract shared by every data transfer object.
 * @template TId - Type of the identifier field
 */
export abstract class BaseType<TId> {
	/** Unique identifier of the object. */
	public abstract id: TId;
}

/**
 * Payload returned by every paginated search endpoint.
 * @template T - Element type
 */
export interface Paginated<T> {
	/** Page content. */
	readonly elements: T[];

	/** Total number of records matching the filters, ignoring pagination. */
	readonly totalRecord: number;
}

/**
 * A `Record` whose values are only known at runtime.
 * Used where TypeORM demands a dynamic key that cannot be expressed statically.
 */
export type DynamicRecord = Record<string, unknown>;
