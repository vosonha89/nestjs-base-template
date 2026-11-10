import { AuthTokenDto } from './auth.dto';

/**
 * Credentials supplied to {@link IAuthService.login}.
 */
export interface ILoginInput {
	/** Email address of the account. */
	readonly email: string;

	/** Plain text password. */
	readonly password: string;
}

/**
 * Contract for the authentication service.
 */
export interface IAuthService {
	/**
	 * Verifies credentials and issues an access token.
	 * @param input - Credentials supplied by the caller
	 * @returns The token and the authenticated profile
	 * @throws AppError `401` when the credentials are invalid
	 */
	login(input: ILoginInput): Promise<AuthTokenDto>;
}
