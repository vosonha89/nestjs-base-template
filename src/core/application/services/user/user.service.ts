import { UserDto } from "../../dtos/user.dto";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { RequestContextServiceSymbol } from "../../../domain/common/service/requestContext.service";
import { IRequestContextService } from "../../../domain/common/service/interfaces/requestContext.service.interface";
import {
	UserRepository,
	UserRepositorySymbol
} from "../../../../infrastructure/persistence/repositories/user.repository";
import { UserEntity } from "../../../../infrastructure/persistence/entities/user.entity";
import { BaseDataService } from "src/core/domain/common/base/baseData.service";
import { IUserService } from "../../interfaces/user.service.interface";

/**
 * Symbol and interface definition for Hello World service
 * @namespace UserService
 */
export const UserServiceSymbol = Symbol("UserService");

/**
 * UserService class extends the BaseDataService to provide specific functionality
 * for managing User data. This class is responsible for implementing operations
 * related to Users, such as CRUD operations, and ensuring compliance with
 * the IUserService interface.
 *
 * The UserService is designed to handle business logic associated with
 * managing User entities and acts as an intermediary between the application's
 * higher-level components and the data layer.
 *
 * @template T - Represents the DTO model used in the service, in this case, UserDto.
 * @template U - Represents the type of the identifier for the Users, in this case, number.
 *
 * @extends BaseDataService<T, U>
 * @implements IUserService
 */
@Injectable({ scope: Scope.REQUEST })
export class UserService
	extends BaseDataService<UserDto, UserEntity, number>(UserDto, UserEntity)
	implements IUserService {
	constructor(
		@Inject(RequestContextServiceSymbol) private readonly requestContext: IRequestContextService,
		@Inject(UserRepositorySymbol) private readonly UserRepository: UserRepository
	) {
		super(requestContext, UserRepository);
	}

	/**
	 * Validates user credentials
	 * @param email user email
	 * @param pass user password
	 * @returns UserDto or null
	 */
	public async validateUser(email: string, pass: string): Promise<UserDto | null> {
		const users = await this.UserRepository.find({ where: { email } as any });
		const user = users.length > 0 ? users[0] : null;
		if (user?.password === pass) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password, ...result } = user;
			return result as UserDto;
		}
		return null;
	}
}
