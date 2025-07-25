import { PsqlRepository } from "../database/psqlRepository";
import { ProductEntity } from "../entities/product.entity";
import { Inject, Injectable } from "@nestjs/common";
import { PsqlContext, PsqlContextSymbol } from "../database/psqlContext";

/**
 * A unique symbol used as an identifier for the ProductRepository.
 * This symbol is intended to ensure a unique, immutable reference
 * for dependency injection or module resolution within an application.
 */
export const ProductRepositorySymbol = Symbol("ProductRepository");

/**
 * ProductRepository is a data access class responsible for handling operations
 * related to the persistence and retrieval of ProductEntity objects.
 * It extends the generic PsqlRepository class with ProductEntity as the managed entity type
 * and number as the type for entity identifiers.
 *
 * This repository provides predefined database management methods such as create, read,
 * update, and delete for ProductEntity objects while leveraging the PostgresQL database.
 *
 * Ensure to use dependency injection to create an instance of this class.
 */
@Injectable()
export class ProductRepository extends PsqlRepository<ProductEntity, number> {
    constructor(@Inject(PsqlContextSymbol) protected readonly psqlContext: PsqlContext) {
        super(psqlContext, ProductEntity);
    }
}