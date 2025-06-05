import 'dotenv/config';

/**
 * App environment. Read data from .env file
 */
class Environment {
    public readonly PORT = process.env.PORT ?? 3000;
    public readonly ENV = process.env.ENV ?? '';
    public readonly VERSION = process.env.VERSION ?? '';
}

export const AppEnvironment = new Environment();