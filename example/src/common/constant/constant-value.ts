/**
 * Shared literal values used across the application.
 */
export class ConstantValue {
	/** Default page index, 1 based. */
	public static readonly PAGE_INDEX = 1;

	/** Default page size when the client does not send one. */
	public static readonly PAGE_SIZE = 10;

	/** Hard upper bound for `page size` so a client cannot request the whole table. */
	public static readonly MAX_PAGE_SIZE = 100;

	/** Cost factor used by bcrypt. 12 is a good balance for 2026 hardware. */
	public static readonly PASSWORD_HASH_ROUNDS = 12;

	/** Header used to correlate a request across logs and services. */
	public static readonly REQUEST_ID_HEADER = 'x-request-id';
}
