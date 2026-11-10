import { IBaseDataService } from '@common/base/base-data.service.interface';
import { UserDto } from './user.dto';

/**
 * Contract for the user business service.
 * @extends IBaseDataService
 */
export interface IUserService extends IBaseDataService<UserDto, number> {
	/**
	 * Verifies an email / password pair.
	 *
	 * Implementations must compare against a hash, never a plain text value.
	 * @param email - Email address supplied by the caller
	 * @param password - Plain text password supplied by the caller
	 * @returns The user without sensitive fields, or `null` when the pair is invalid
	 */
	validateUser(email: string, password: string): Promise<UserDto | null>;
}
