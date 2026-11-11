/**
 * Password hashing contract.
 *
 * Business code depends on this interface only, so the algorithm can be
 * replaced (argon2, scrypt, a managed KMS…) without touching services.
 */
export interface IHashService {
	/**
	 * Hashes a plain text secret.
	 * @param plain - Plain text value
	 * @returns The encoded hash, safe to persist
	 */
	hash(plain: string): Promise<string>;

	/**
	 * Verifies a plain text secret against a stored hash.
	 * @param plain - Plain text value supplied by the caller
	 * @param hashed - Previously stored hash
	 * @returns `true` when they match
	 */
	compare(plain: string, hashed: string): Promise<boolean>;
}
