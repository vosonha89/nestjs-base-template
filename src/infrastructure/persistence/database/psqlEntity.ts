import { BaseEntity } from "../../../core/domain/common/base/base.entity";
import { Column, PrimaryGeneratedColumn } from "typeorm";

/**
 * Represents a base entity for a PostgreSQL database with common fields.
 * This class extends the functionality of a base entity by incorporating
 * autogenerated ID, and date fields for creation, update, and deletion timestamps.
 *
 * The `PsqlEntity` class can be used as a standardized structure for any
 * database entity that requires these common properties.
 *
 * @template ID - The type of the unique identifier (id) for the entity.
 *
 * Properties:
 * - id: Autogenerated unique identifier for the entity.
 * - createdAt: The date when the entity was created. This field is optional.
 * - updatedAt: The date when the entity was last updated. This field is optional.
 * - deletedAt: The date when the entity was marked for deletion. Nullable.
 */
export class PsqlEntity<ID> extends BaseEntity<ID> {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id!: ID;
    @Column({ type: 'date', nullable: true })
    createdAt!: Date;
    @Column({ type: 'date', nullable: true })
    updatedAt!: Date;
    @Column({ type: 'date', nullable: true })
    deletedAt?: Date;
}
