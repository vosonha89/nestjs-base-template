import * as process from "node:process";

/**
 * The `AppEnvironment` class provides global access to environment variables and their defaults
 * for the application. This employs the Singleton pattern to ensure that only one instance of
 * the environment configuration is created and accessed throughout the application.
 *
 * It includes settings such as application name, port, environment type, version, and database
 * configuration parameters.
 *
 * Static access to the singleton instance is provided through the `value` property. Environment
 * variables are retrieved from the `process.env` object and have default values in case the
 * respective variables are not defined.
 */
export class AppEnvironment {
	private static _value?: AppEnvironment;
	public static get value() {
		if (!this._value) {
			this._value = new AppEnvironment();
		}
		return this._value;
	}

	public APP_NAME = process.env.APP_NAME ?? 'nestjs-base-template';
	public PORT = process.env.PORT ?? 3000;
	public ENV = process.env.ENV ?? '';
	public VERSION = process.env.VERSION ?? '';
	public DB_HOST = process.env.DB_HOST ?? 'localhost';
	public DB_PORT = process.env.DB_PORT ?? '5432';
	public DB_USERNAME = process.env.DB_USERNAME ?? 'postgres';
	public DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
	public DB_DATABASE = process.env.DB_DATABASE ?? 'nestjs_db';
}
