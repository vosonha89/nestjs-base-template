/**
 * Runtime environments supported by the template.
 *
 * The name of the loaded env file is derived from this value:
 * `env/.env.${NODE_ENV}` — see {@link AppConfigModule}.
 */
export enum AppEnvironment {
	/** Local development. Verbose logging, Swagger enabled, no schema sync. */
	DEVELOPMENT = 'development',

	/** Pre-production / staging used for acceptance testing. */
	UAT = 'uat',

	/** Production. Swagger disabled, strict secrets, strict TLS. */
	PRODUCTION = 'production',

	/** Automated test runs. Database access is mocked. */
	TEST = 'test'
}
