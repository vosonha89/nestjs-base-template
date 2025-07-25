import { PsqlRepository } from "../database/psqlRepository";
import { Inject, Injectable } from "@nestjs/common";
import { UserEntity } from "../entities/user.entity";
import { PsqlContext, PsqlContextSymbol } from "../database/psqlContext";

/**
 * A unique symbol used to identify the UserRepository dependency.
 * This symbol can be utilized as a key for associating or retrieving the UserRepository
 * through dependency injection mechanisms in the application.
 *
 * The usage of a symbol ensures that the key remains unique and avoids
 * potential collisions with other identifiers or keys within the application.
 */
export const UserRepositorySymbol = Symbol("UserRepository");

/**
 * UserRepository is a repository class that extends the generic PsqlRepository.
 * It is designed to handle operations related to the UserEntity using PostgresQL as the database.
 * The repository focuses on providing data access methods for managing UserEntity instances.
 *
 * @extends PsqlRepository<UserEntity, number>
 *
 * @template UserEntity The entity type the repository operates on.
 * @template number The type of the primary key used by the entity.
 *
 * @description
 * This class utilizes the functionality of PsqlRepository to perform
 * CRUD operations and custom queries related to UserEntity in the database.
 * Use this class to encapsulate data persistence logic specific to user data.
 */
@Injectable()
export class UserRepository extends PsqlRepository<UserEntity, number> {
    constructor(@Inject(PsqlContextSymbol) protected readonly psqlContext: PsqlContext) {
        super(psqlContext, UserEntity);
    }
}