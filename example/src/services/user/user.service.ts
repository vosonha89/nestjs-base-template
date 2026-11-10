import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseDataService } from '@common/base/base-data.service';
import { AppError, ClientError } from '@common/exception/client-error';
import { GlobalError } from '@common/exception/global-error';
import { HashServiceSymbol } from '@common/service/bcrypt-hash.service';
import { IHashService } from '@common/service/hash.service.interface';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { IRequestContextService } from '@common/service/request-context.service.interface';
import { UserEntity } from '@data/entity/user.entity';
import { UserRepository, UserRepositorySymbol } from '@data/repository/user.repository';
import { UserDto } from './user.dto';
import { IUserService } from './user.service.interface';

/**
 * Service symbol for DI register
 */
export const UserServiceSymbol = Symbol('UserService');

/**
 * Business service for user management.
 *
 * Adds password hashing and credential verification on top of the generic CRUD
 * behaviour. Everything the base class exposes stays available unchanged.
 * @extends BaseDataService
 * @implements IUserService
 */
@Injectable()
export class UserService extends BaseDataService<UserDto, UserEntity, number> implements IUserService {
	/**
	 * Constructor
	 * @param requestContext - Service exposing the current request
	 * @param userRepository - Repository for user data access
	 * @param hashService - Service used to hash and verify passwords
	 */
	public constructor(
		@Inject(RequestContextServiceSymbol) requestContext: IRequestContextService,
		@Inject(UserRepositorySymbol) private readonly userRepository: UserRepository,
		@Inject(HashServiceSymbol) private readonly hashService: IHashService
	) {
		super(requestContext, userRepository, {
			dto: UserDto,
			entity: UserEntity,
			searchableFields: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt'],
			defaultSortField: 'id',
			defaultSortDirection: 'DESC'
		});
	}

	/**
	 * Verifies an email / password pair.
	 * @param email - Email address supplied by the caller
	 * @param password - Plain text password supplied by the caller
	 * @returns The user without sensitive fields, or `null` when the pair is invalid
	 */
	public async validateUser(email: string, password: string): Promise<UserDto | null> {
		const user = await this.userRepository.findByEmail(email);

		if (user === null || !user.isActive) {
			return null;
		}

		const matches = await this.hashService.compare(password, user.password);

		return matches ? this.toDto(user) : null;
	}

	/**
	 * Creates a user, hashing the password before it reaches the database.
	 * @param data - User fields, `password` is required in plain text
	 * @returns The created user, without the password
	 * @throws AppError `4001` when `password` is missing
	 */
	public override async create(data: Partial<UserDto>): Promise<UserDto> {
		if (data.password === undefined || data.password === '') {
			const message = GlobalError.RequiredError('password');
			throw new AppError(HttpStatus.BAD_REQUEST, new ClientError(String(message.code), message.msg));
		}

		const hashed = await this.hashService.hash(data.password);
		return super.create({ ...data, password: hashed });
	}

	/**
	 * Updates a user, hashing a new password when one is supplied.
	 *
	 * An empty string means "leave the password untouched", which lets the same
	 * update payload be reused without leaking the current hash to the client.
	 * @param id - Identifier of the user
	 * @param data - Fields to change
	 * @returns The updated user, without the password
	 */
	public override async update(id: number, data: Partial<UserDto>): Promise<UserDto> {
		const { password } = data;

		if (password !== undefined && password === '') {
			delete data.password;
		} else if (password !== undefined) {
			data.password = await this.hashService.hash(password);
		}

		return super.update(id, data);
	}
}
