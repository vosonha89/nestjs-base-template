/**
 * Contract every seeder implements.
 *
 * Implementing this interface — rather than calling a repository from
 * `SeedService` — keeps the seeder free of the orchestration loop and lets a
 * new app register any number of independent seeders without editing
 * `SeedService`.
 */
export interface ISeeder {
	/**
	 * Human readable name used in the log line and in error messages.
	 */
	readonly name: string;

	/**
	 * Creates the records this seeder owns.
	 *
	 * Must be idempotent: running it twice leaves the database unchanged.
	 * @returns Resolves once every record has been ensured
	 */
	run(): Promise<void>;
}
