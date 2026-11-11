# NestJS API Template — N-Layer

Production-ready NestJS starter built around a **three-layer architecture**
(Controller → Service → Repository), TypeORM migrations, JWT authentication, a
frozen response envelope and an error catalogue that clients can branch on.

It ships **no domain code**: the entity registry is empty, there is no migration
and no seed. A fresh clone boots, answers `/health`, and is ready for your first
feature.

---

## Contents

- [Quick start](#quick-start)
- [Architecture at a glance](#architecture-at-a-glance)
- [The three registries](#the-three-registries)
- [API surface](#api-surface)
- [Response envelope](#response-envelope)
- [Error codes](#error-codes)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Running in Docker](#running-in-docker)
- [Security notes](#security-notes)
- [Toolchain decisions](#toolchain-decisions)

---

## Quick start

```bash
# 1. Rename the template (also generates a real JWT secret, then deletes itself)
./scripts/init-app.sh --name my-order-api --port 3002 --db my_order_db

# 2. Dependencies
npm install

# 3. A database
docker compose up -d

# 4. Your first feature
npm run generate:feature -- --name order --fields "code:string:unique,total:numeric(12,2),stock:integer"

# 5. Schema, then run
npm run migration:generate -- src/data/migration/AddOrder
npm run migration:run
npm run start:dev
```

| Endpoint | URL |
| --- | --- |
| API base | `http://localhost:3002/api/v1` |
| Swagger UI | `http://localhost:3002/api/doc` |
| OpenAPI JSON | `http://localhost:3002/api/doc-json` |
| Health probe | `http://localhost:3002/health` |

> **No auth feature is included.** `JwtAuthGuard` is global, so every route is
> protected unless it carries `@Public()`. Your first module is normally `auth`
> with a login endpoint. The reference implementation, including bcrypt
> verification and user-enumeration protection, is in
> [`../example/src/services/auth/`](../example/src/services/auth).

---

## Architecture at a glance

```
HTTP  ──►  presentation/   controllers, requests, responses, modules
                 │
                 ▼
           services/        business rules, DTOs, service interfaces
                 │
                 ▼
             data/          entities, repositories, migrations, seed
                 │
                 ▼
           common/  config/  base classes, guards, pipes, filters, logging

Dependency rule: an arrow may only point downwards. `presentation` may never
import `@data/*` — ESLint fails the build if it does.
```

| Layer | Folder | Owns | Must not know about |
| --- | --- | --- | --- |
| Presentation | `src/presentation` | HTTP verbs, status codes, request validation, Swagger | TypeORM, entities |
| Service | `src/services` | business rules, transaction orchestration, DTO mapping | HTTP `Request`/`Response` |
| Data | `src/data` | entities, repositories, migrations, seed | controllers |
| Common | `src/common` | base classes, guards, pipes, filters, logging | any of the above |
| Config | `src/config` | env loading + validation | everything else |

Full detail: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## The three registries

A feature is wired into the application through exactly three files. Because
those are the only files that differ between one app and another, everything
consuming them (`database.module.ts`, `presentation.module.ts`, `main.ts`) is
identical in every app built on this template.

| File | You add |
| --- | --- |
| `src/data/feature.registry.ts` | `ENTITIES`, `REPOSITORY_PROVIDERS`, `REPOSITORY_EXPORTS` |
| `src/presentation/feature.registry.ts` | `FEATURE_MODULES`, `SWAGGER_TAGS` |
| `src/data/seed/seed.registry.ts` | `SEEDERS` |

`npm run generate:feature` writes all of them for you. Doing it by hand is a few
lines per feature:

```ts
// src/data/feature.registry.ts
import { OrderEntity } from './entity/order.entity';
import { OrderRepository, OrderRepositorySymbol } from './repository/order.repository';

export const ENTITIES = [OrderEntity];
export const REPOSITORY_PROVIDERS = [{ provide: OrderRepositorySymbol, useClass: OrderRepository }];
export const REPOSITORY_EXPORTS = [OrderRepositorySymbol];
```

---

## API surface

Every feature gets the same CRUD surface for free by extending
`BaseDataController(...)` and `BaseDataService`:

| Method | Path | Success |
| --- | --- | --- |
| `POST` | `/api/v1/<feature>/search` | `200` — body `{ page, size, count, filters, sort }` |
| `POST` | `/api/v1/<feature>` | `201` |
| `GET` | `/api/v1/<feature>/:id` | `200` |
| `PUT` | `/api/v1/<feature>/:id` | `200` |
| `DELETE` | `/api/v1/<feature>/:id` | `200` — soft delete |

Search, filter, sort and pagination are implemented once, in `BaseDataService`.
Filter and sort columns must appear in that service's `searchableFields` /
`sortableFields`; anything else is rejected with `4007`, which is what stops a
client from probing a sensitive column.

---

## Response envelope

Every response — success or failure — has the same shape:

```json
{
  "serverDateTime": "2026-01-01T00:00:00.000Z",
  "status": 200,
  "msg": "Success",
  "successful": true,
  "data": {}
}
```

A failure replaces `data` with `exception`:

```json
{
  "serverDateTime": "2026-01-01T00:00:00.000Z",
  "status": 400,
  "msg": "email is required.",
  "successful": false,
  "exception": { "errorCode": "4001", "errorMessage": "email is required." }
}
```

`ErrorResponse` never carries `data`; `BaseResponse` never carries `exception`.
Controllers build both through the factories (`OKResponse`, `CreatedResponse`),
never by hand.

---

## Error codes

`GlobalError` is the single catalogue. HTTP statuses are literal (`401`, `404`,
`409`, `429`); validation failures get a stable numeric code so a client can
branch without parsing prose:

| Code | Meaning |
| --- | --- |
| `4001` | required field missing |
| `4002` | wrong type or format |
| `4003` | too long |
| `4004` | too short |
| `4005` | above the maximum |
| `4006` | below the minimum |
| `4007` | field not in the searchable/sortable whitelist |
| `4008` | a domain rule rejected the request (`BusinessRuleError`) |

Throw `AppError` with an entry from the catalogue; never `throw new Error(...)`
in business code, and never build an HTTP response inside a service.

---

## Environment variables

`env/.env.${NODE_ENV}` is loaded with a fallback to `env/.env.development`.
`src/config` is the only place that reads `process.env`, and every variable is
validated at boot — one error listing every problem, not a failure at the first
request.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development` / `uat` / `production` / `test` |
| `APP_NAME` | yes | — | Swagger title, log `service` field, Postgres `application_name` |
| `APP_PORT` | yes | `3001` | |
| `APP_VERSION` | yes | `1.0.0` | |
| `API_PREFIX` | yes | `api` | |
| `API_DEFAULT_VERSION` | yes | `1` | |
| `SWAGGER_ENABLED` | yes | `true` | keep `false` in production |
| `SWAGGER_PATH` | yes | `api/doc` | |
| `DB_HOST` / `DB_PORT` | yes | — | |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | yes | — | |
| `DB_SSL` | yes | `false` | `true` for a managed provider |
| `DB_SSL_REJECT_UNAUTHORIZED` | no | `true` | keep `true` whenever possible |
| `DB_LOGGING` | no | `false` | |
| `DB_RETRY_ATTEMPTS` / `DB_RETRY_DELAY` / `DB_POOL_SIZE` | no | `10` / `3000` / `10` | |
| `JWT_SECRET` | yes | — | **≥ 32 characters, or the app refuses to boot** |
| `JWT_EXPIRES_IN` | yes | `1d` | `ms`-compatible: `30m`, `12h`, `7d` |
| `CORS_ORIGINS` | yes | `http://localhost:3000` | comma separated; `*` allows all |
| `THROTTLE_TTL` | yes | `60` | **seconds** — the module converts to ms |
| `THROTTLE_LIMIT` | yes | `60` | requests per window |

Adding a variable touches **three** places: the schema in
`src/config/env.validation.ts`, the namespace in `src/config/configuration.ts`,
and `.env.example`. Forgetting one is the usual bug.

---

## Scripts

| Script | Does |
| --- | --- |
| `start:dev` | watch mode |
| `build` / `start:prod` | compile / run the compiled output |
| `lint` / `lint:check` | ESLint, fix / fail |
| `format` / `format:check` | Prettier, write / verify |
| `typecheck` | `tsc --noEmit` |
| `test` / `test:cov` | unit tests / with coverage |
| `test:e2e` | transport-level suite; **no database required** |
| `migration:generate` / `migration:run` / `migration:revert` | TypeORM CLI |
| `seed` | idempotent demo data (no seeders registered in the template) |
| `generate:feature` | scaffold a feature and wire the registries |

`npm run generate:feature -- --help` documents the field grammar.

---

## Testing

```
src/**/*.spec.ts        unit tests, beside the file under test
test/**/*.e2e-spec.ts   transport-level tests
test/support/           shared stubs
```

The e2e suite boots the real pipe / guard / interceptor / filter stack through
`configureApplication()` but deliberately **not** the data module, so it runs
without Postgres. That is what makes `npm run test:e2e` usable on a bare CI
container. Anything that needs a database belongs in an application's own
suite — see [`../example/test/`](../example/test).

Coverage thresholds are a floor, never a target:

```
lines 75 · statements 75 · functions 55 · branches 70
```

Never lower a threshold to make a suite pass; add the test.

---

## Running in Docker

```bash
docker build -t my-api .
docker run --rm -p 3001:3001 --env-file env/.env.production my-api
```

Four-stage build (deps → build → prod-deps → runtime), runs as the unprivileged
`node` user, and stops on `SIGTERM` because `main.ts` calls
`enableShutdownHooks()`, so the connection pool drains before the container
exits.

`docker compose up -d` starts PostgreSQL 17 plus Adminer on
<http://localhost:8080>.

---

## Security notes

- `env/.env.*` is git-ignored; only `.env.example` is committed;
- `JWT_SECRET` must be ≥ 32 characters — the app refuses to start otherwise;
- passwords are hashed with bcrypt (cost 12) through `HashServiceSymbol`;
- a secret column declares `select: false`, and its DTO has no `@Expose()`, so
  the value cannot reach a response even by accident;
- `JwtAuthGuard` is global: every route is protected unless it carries
  `@Public()`;
- `whitelist` + `forbidNonWhitelisted` reject unknown body properties, and the
  filter/sort whitelist blocks probing of sensitive columns;
- rate limiting applies to every route including `@Public()` ones; `/health`
  opts out so a probe can never be throttled into a 503;
- logs redact `authorization`, `cookie`, `set-cookie`, `password` and
  `accessToken`, and never contain request bodies;
- 5xx responses return an opaque message; the stack only reaches the log.

---

## Toolchain decisions

| Decision | Why |
| --- | --- |
| **NestJS 12** | current major; note it is **ESM-only** |
| **TypeScript 6.0.3** (not 7.x) | TS 7.0 ships only the `tsc` executable and **no programmatic compiler API**, so `nest build` fails and `typescript-eslint` refuses to run. Re-evaluate at **7.1**, which restores the API. |
| **TypeORM 1.1.2** | dual CJS/ESM, so it does not repeat the NestJS 12 ESM problem. Note the option types were renamed in 1.x: `PostgresDataSourceOptions`, not `PostgresConnectionOptions`. |
| **`bcryptjs`** | pure JS, so `npm install` never needs a C++ toolchain; identical `$2b$` output |
| **`nestjs-pino`** | structured JSON logs with redaction, behind `ILoggingService` |
| **`AsyncLocalStorage`** instead of `Scope.REQUEST` | request data without re-instantiating the DI graph per request |
| **`--experimental-vm-modules` for Jest** | NestJS 12 is ESM-only; the flag lets Jest use Node's `require(esm)` while the project still compiles to CommonJS |
| **Node ≥ 22.13** | first release with `require(esm)` on by default; also the floor ESLint 10 declares |
| **ESLint 10** | v9 is EOL; `typescript-eslint` 8.x declares `^10.0.0` |
| **`no-restricted-imports`** | four layer patterns are enough; one less plugin than `eslint-plugin-boundaries` |

---

## License

MIT