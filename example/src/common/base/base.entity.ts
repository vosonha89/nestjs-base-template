/**
 * Contract every persisted entity satisfies.
 *
 * Kept free of persistence decorators so the shape can be reused by tests,
 * mocks and future storage engines.
 * @template TId - Type of the identifier field
 */
export abstract class BaseEntity<TId> {
	/** Unique identifier of the entity. */
	public abstract id: TId;

	/** Timestamp when the row was inserted. */
	public abstract createdAt: Date;

	/** Timestamp of the last modification. */
	public abstract updatedAt: Date;
}
