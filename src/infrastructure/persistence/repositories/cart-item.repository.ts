import { PsqlRepository } from "../database/psqlRepository";
import { CartItemEntity } from "../entities/cart-item.entity";
import { Inject, Injectable } from "@nestjs/common";
import { PsqlContext, PsqlContextSymbol } from "../database/psqlContext";

/**
 * A unique symbol used as an identifier for the CartItemRepository.
 * This symbol is intended to ensure a unique, immutable reference
 * for dependency injection or module resolution within an application.
 */
export const CartItemRepositorySymbol = Symbol("CartItemRepository");

/**
 * CartItemRepository is a data access class responsible for handling operations
 * related to the persistence and retrieval of CartItemEntity objects.
 * It extends the generic PsqlRepository class with CartItemEntity as the managed entity type
 * and number as the type for entity identifiers.
 *
 * This repository provides predefined database management methods such as create, read,
 * update, and delete for CartItemEntity objects while leveraging the PostgresQL database.
 *
 * Ensure to use dependency injection to create an instance of this class.
 */
@Injectable()
export class CartItemRepository extends PsqlRepository<CartItemEntity, number> {
    constructor(@Inject(PsqlContextSymbol) protected readonly psqlContext: PsqlContext) {
        super(psqlContext, CartItemEntity);
    }
}
