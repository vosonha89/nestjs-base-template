import { Inject, Injectable } from '@nestjs/common';
import { PsqlContext, PsqlContextSymbol } from '../context/psql.context';
import { UserEntity } from '../entity/user.entity';
import { PsqlRepository } from './psql.repository';

/**
 * Service symbol for DI register
 */
export const UserRepositorySymbol = Symbol('UserRepository');

/**
 * Data access for {@link UserEntity}.
 * @extends PsqlRepository
 */
@Injectable()
export class UserRepository extends PsqlRepository<UserEntity, number> {
	/**
	 * Constructor
	 * @param psqlContext - Persistence context owning the connection pool
	 */
	public constructor(@Inject(PsqlContextSymbol) psqlContext: PsqlContext) {
		super(psqlContext, UserEntity);
	}

	/**
	 * Finds a user by email, including the password hash.
	 *
	 * Uses a query builder because the `password` column is declared
	 * `select: false`, which `find()` cannot override reliably. Soft deleted
	 * rows are filtered explicitly since query builders bypass
	 * `@DeleteDateColumn`.
	 * @param email - Email address to look up
	 * @returns The user, or `null` when none exists
	 */
	public async findByEmail(email: string): Promise<UserEntity | null> {
		return this.repository
			.createQueryBuilder('user')
			.addSelect('user.password')
			.where('user.email = :email', { email })
			.andWhere('user.deletedAt IS NULL')
			.getOne();
	}
}
