# `src/config` — configuration

The only place in the codebase allowed to read `process.env`.

| File | Responsibility |
| --- | --- |
| `app-environment.enum.ts` | the environments the app understands (`development`, `uat`, `production`, `test`) |
| `config.type.ts` | `IAppConfig`, `IDbConfig`, `IJwtConfig` + `IConfig` |
| `configuration.ts` | `registerAs` namespaces: `appConfig`, `dbConfig`, `jwtConfig` |
| `env.validation.ts` | `EnvironmentVariables` schema + `validateEnvironment()` |
| `app-config.module.ts` | `ConfigModule.forRoot(...)`, `@Global()` |

## How a value travels

```
env/.env.development
        │  ConfigModule.forRoot({ envFilePath: [...] })
        ▼
validateEnvironment()        class-validator, fails the boot with every problem listed
        │
        ▼
appConfig() / dbConfig() / jwtConfig()    typed namespace, read from process.env
        │
        ▼
ConfigService.getOrThrow<IAppConfig>('app')     ← consumers use this, never process.env
```

## Rules

- **Add a variable in three places**: the schema in `env.validation.ts`, the
  namespace in `configuration.ts`, and `.env.example` (+ a row in the README
  table). Forgetting one is the usual bug.
- A required secret is validated at boot, not at first use — the app must refuse
  to start rather than fail a request.
- `synchronize` is hard-coded `false` and is **not** configurable.
- Env files are resolved as `env/.env.${NODE_ENV}` with a fallback to
  `env/.env.development`, so `NODE_ENV=test` (set by Jest) works on a fresh
  clone.
- `throttleTtl` is in **seconds**. The conversion to the milliseconds that
  `@nestjs/throttler` v6 requires happens in `CommonModule`, not here — `config`
  stays unit-agnostic about a library it does not import.
- Never log a resolved config object: it contains `DB_PASSWORD` and
  `JWT_SECRET`.

## Dependencies

None. This folder may import `@nestjs/*`, `class-validator` and
`class-transformer` only — ESLint enforces it.