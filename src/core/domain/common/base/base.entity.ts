/**
 * Abstract base entity class that provides common fields for all entities
 * @template ID - The type of the identifier field
 */
export abstract class BaseEntity<ID> {
    /** Unique identifier for the entity */
    abstract id: ID;

    /** Timestamp when the entity was created */
    abstract createdAt: Date;

    /** Timestamp when the entity was last updated */
    abstract updatedAt: Date;
}
