/**
 * Authenticated principal derived from the JWT payload.
 *
 * The payload is signed by `AuthService` and verified by `JwtStrategy`, so the
 * shape below must stay in sync with `IAccessTokenPayload`.
 */
export class UserInfo {
	/** User identifier (mapped from the `sub` claim). */
	public id!: number;

	/** Email address of the authenticated user. */
	public email!: string;

	/** Role used by `RolesGuard`. */
	public role!: string;
}
