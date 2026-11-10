# NestJS API Template — N-Layer

Production-ready NestJS starter built around a **three-layer MVC architecture**
(Controller → Service → Repository), TypeORM migrations, JWT authentication,
a frozen response envelope and an error catalogue that clients can branch on.

This is the `new/` rewrite of the original Clean Architecture template in
`old/`: same conventions, same style DNA, far less ceremony and every known bug
fixed. See [Migrating from `old/`](#migrating-from-old) and
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the reasoning.

---

## Contents

- [Quick start](#quick-start)
- [Architecture at a glance](#architecture-at-a-glance)
- [API surface](#api-surface)
- [Response envelope](#response-envelope)
- [Error codes](#error-codes)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Running in Docker](#running-in-docker)
- [Security notes](#security-notes)
- [Migrating from `old/`](#migrating-from-old)
- [Toolchain decisions](#toolchain-decisions)

---

## Quick start

```bash
# 1. Dependencies
npm install

# 2. Configuration
cp .env.example env/.env.development      # then fill DB_* and JWT_SECRET

# 3. A database — either a local container …
docker compose up -d

#    … or a managed instance. For a managed one set in env/.env.development:
#    DB_HOST=…  DB_PORT=5432  DB_USERNAME=…  DB_PASSWORD=…  DB_DATABASE=…
#    DB_SSL=true  DB_SSL_REJECT_UNAUTHORIZED=true

# 4. Generate a JWT secret (minimum 32 characters)
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 5. Schema + demo data (idempotent)
npm run migration:run
npm run seed

# 6. Run
npm run start:dev
```

| Endpoint | URL |
| --- | --- |
| API base | `http://localhost:3001/api/v1` |
| Swagger UI | `http://localhost:3001/api/doc` |
| OpenAPI JSON | `http://localhost:3001/api/doc-json` |
| Health probe | `http://localhost:3001/health` |

Seeded accounts:

| Email | Password | Role |
| --- | --- | --- |
| `admin@demo.io` | `Admin@12345` | `admin` |
| `user@demo.io` | `User@12345` | `user` |

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@demo.io","password":"Admin@12345"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.accessToken))")

curl -s http://localhost:3001/api/v1/user/1 -H "Authorization: Bearer $TOKEN"
```

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
| Service | `src/services` | business rules, transactions orchestration, DTO mapping | HTTP `Request`/`Response` |
| Data | `src/data` | entities, repositories, migrations, seed | controllers |
| Common | `src/common` | base classes, guards, pipes, filters, logging | any of the above |
| Config | `src/config` | env loading + validation | everything else |

Full detail: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## API surface

Every feature gets the same CRUD surface for free by extending
`BaseDataController(...)` and `BaseDataService`:

| Method | Path | Success |
| --- | --- | --- |
| `POST` | `/api/v1/user/search` | `200` — body `{ page, size, count, filters, sort }` |
| `POST` | `/api/v1/user` | `201` |
| `GET` | `/api/v1/user/:id` | `200` |
| `PUT` | `/api/v1/user/:id` | `200` |
| `DELETE` | `/api/v1/user/:id` | `200` — soft delete |

Feature specific endpoints are plain controller methods, e.g.
`POST /api/v1/product/:id/adjust-stock` shows a transactional, row-locked
operation.

### Search payload

```json
{
  "page": 1,
  "size": 10,
  "count": true,
  "filters": [
    { "fieldName": "role", "fieldValue": "admin", "filterCondition": "=" },
    { "fieldName": "createdAt", "fieldValue": ["2026-01-01", "2026-12-31"], "filterCondition": "<>" }
  ],
  "sort": { "sortField": "email", "sortType": "ASC" }
}
```

Operators (`FilterCondition`): `~` LIKE, `=` equal, `!=` not equal, `^` IN,
`!^` NOT IN, `>` `>=` `<` `<=` comparisons, `<>` BETWEEN, `!<>` NOT BETWEEN.

`fieldName` and `sortField` are checked against a **per-service whitelist**
(`searchableFields` / `sortableFields`). Anything else is rejected with `4007`,
so a client can never filter or sort on `password`.

### Health

`GET /health` is unversioned, outside the API prefix and public, so a probe URL
never moves. It returns the Terminus format (`{ status: 'ok' | 'error', … }`)
rather than the application envelope, because orchestrators expect it.

---

## Response envelope

Every JSON response — success **and** failure — uses the same shape, and the
transport status always matches `status`.

```jsonc
// success
{
  "serverDateTime": "2026-11-10T04:00:00.000Z",
  "status": 200,
  "msg": "OK",
  "successful": true,
  "data": { "id": 1, "email": "admin@demo.io" }
}

// failure
{
  "serverDateTime": "2026-11-10T04:00:00.000Z",
  "status": 400,
  "msg": "password is not allowed in this operation. (filter)",
  "successful": false,
  "exception": { "errorCode": "4007", "errorMessage": "password is not allowed in this operation. (filter)" }
}
```

Search responses put `BaseListResponse` in `data`:

```jsonc
{
  "page": 1, "size": 10,
  "totalElements": 42, "totalPages": 5,   // only when "count": true
  "elements": [ … ],
  "hasPrevious": false, "hasMore": true
}
```

Serialisation rules (`ResponseTransformInterceptor`):

- only `@Expose()`-decorated DTO properties ever leave the process, so adding an
  entity column cannot leak it;
- object keys holding `undefined` are omitted;
- `undefined` inside an array becomes `null` so indexes never shift;
- `Date` is rendered as an ISO 8601 string.

---

## Error codes

`errorCode` is a stable string. Clients branch on it, never on `errorMessage`.

| Code | HTTP | Meaning |
| --- | --- | --- |
| `4001` | 400 | required field missing |
| `4002` | 400 | wrong type / format |
| `4003` | 400 | value longer than allowed |
| `4004` | 400 | value shorter than required |
| `4005` | 400 | value above the maximum |
| `4006` | 400 | value below the minimum |
| `4007` | 400 | field not in the searchable/sortable whitelist |
| `4008` | 400 | quantity rule violated (e.g. insufficient stock) |
| `401` | 401 | missing or invalid credentials |
| `403` | 403 | authenticated but not allowed |
| `404` | 404 | resource does not exist |
| `409` | 409 | uniqueness / state conflict (incl. Postgres `23505`) |
| `429` | 429 | rate limit exceeded |
| `500` | 500 | unexpected failure — the internal message is never leaked |

`GlobalError` in `src/common/exception/global-error.ts` is the single source of
truth for these numbers, and `AppValidationPipe` maps every `class-validator`
constraint onto them.

---

## Environment variables

Loaded from `env/.env.${NODE_ENV}`, falling back to `env/.env.development` when
that file is absent (which is what makes the e2e suite work on a fresh clone).
`env/.env.*` is git-ignored; only `.env.example` is committed.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | selects the env file |
| `APP_NAME` | yes | `nestjs-api-template` | Swagger title |
| `APP_PORT` | yes | `3001` | |
| `APP_VERSION` | yes | `1.0.0` | |
| `API_PREFIX` | yes | `api` | global route prefix |
| `API_DEFAULT_VERSION` | yes | `1` | URI versioning |
| `SWAGGER_ENABLED` | yes | `true` | set `false` in production |
| `SWAGGER_PATH` | yes | `api/doc` | |
| `DB_HOST` / `DB_PORT` | yes | — | |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | yes | — | |
| `DB_SSL` | yes | `false` | `true` for managed Postgres |
| `DB_SSL_REJECT_UNAUTHORIZED` | no | `true` | keep `true` whenever possible |
| `DB_LOGGING` | no | `false` | logs executed SQL |
| `DB_RETRY_ATTEMPTS` / `DB_RETRY_DELAY` / `DB_POOL_SIZE` | no | `10` / `3000` / `10` | |
| `JWT_SECRET` | yes | — | **minimum 32 characters**, boot fails otherwise |
| `JWT_EXPIRES_IN` | yes | `1d` | `ms` format: `30m`, `12h`, `7d` |
| `CORS_ORIGINS` | yes | `http://localhost:3000` | comma separated, `*` allowed |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | no | `60` / `60` | `TTL` is in **seconds**; the module converts to the milliseconds `@nestjs/throttler` v6 expects |

Validation happens once, at boot (`src/config/env.validation.ts`). A missing or
malformed value prints **every** problem at once and exits, instead of failing
later at the first request.

> `synchronize` is hard-coded to `false`. Schema changes only happen through
> `npm run migration:run`.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run start:dev` | watch mode |
| `npm run start:prod` | `node dist/main` |
| `npm run build` | compile to `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:check` | ESLint (fix / verify, 0 warnings allowed) |
| `npm run format` / `format:check` | Prettier |
| `npm test` | unit tests |
| `npm run test:cov` | unit tests + coverage gate |
| `npm run test:e2e` | end-to-end suite (needs a reachable database) |
| `npm run migration:generate -- src/data/migration/Name` | diff entities → new migration |
| `npm run migration:run` / `migration:revert` | apply / roll back |
| `npm run seed` | idempotent demo data |

---

## Testing

```bash
npm test          # 121 unit tests, 15 suites
npm run test:cov  # + coverage gate
npm run test:e2e  # 12 e2e tests, needs a database
```

Current gate (`package.json → jest.coverageThreshold`): statements 75 %,
lines 75 %, branches 70 %, functions 55 %.

The unit suite runs with `NODE_OPTIONS=--experimental-vm-modules` (see
[Toolchain decisions](#toolchain-decisions)); the e2e suite boots the real
`AppModule` through `configureApplication()` so prefix, versioning, guards,
pipes, interceptors and filters behave exactly as in production.

Test layout mirrors the source tree (`*.spec.ts` next to the file it covers),
plus `test/support/test-doubles.ts` for shared stubs.

---

## Running in Docker

```bash
docker build -t nestjs-api-template .
docker run --rm -p 3001:3001 --env-file env/.env.production nestjs-api-template
```

The image is a four stage build (deps → build → prod-deps → runtime), runs as
the unprivileged `node` user, and stops on `SIGTERM` with
`enableShutdownHooks()` so the connection pool closes cleanly.

`docker compose up -d` starts PostgreSQL 17 plus Adminer on
<http://localhost:8080> for a machine with no cloud credentials.

---

## Security notes

Hardened compared to `old/`:

- secrets are validated at boot and `env/.env.*` is git-ignored;
- `JWT_SECRET` must be ≥ 32 characters — the app refuses to start otherwise;
- passwords are hashed with bcrypt (cost 12) and compared with
  `bcrypt.compare`; the plain-text comparison is gone;
- `UserEntity.password` is `select: false`, and `UserDto.password` has no
  `@Expose()`, so the hash cannot reach a response even by accident;
- global `JwtAuthGuard` — every route is protected unless it carries
  `@Public()`;
- `whitelist` + `forbidNonWhitelisted` reject unknown body properties, and the
  filter/sort whitelist blocks probing of sensitive columns;
- rate limiting, `helmet`, strict CORS and a size-limited correlation id;
  the quota comes from `THROTTLE_TTL` (seconds) / `THROTTLE_LIMIT`, applies to
  every route including the public `/auth/login`, and `/health` opts out so a
  probe can never be throttled;
- logs redact `authorization`, `cookie`, `set-cookie`, `password` and
  `accessToken`, and never contain request bodies;
- 5xx responses return an opaque message; the stack only reaches the log.

### ⚠️ Outstanding action for the repository owner

The git history of `old/` still contains `old/env/.env.development` **including
a live database password**, and that password has *not* been rotated. Rotating a
credential does not remove it from history — treat that database as compromised,
rotate the password in the Neon console, and purge the file from history
(`git filter-repo`) before making this repository public.

---

## Migrating from `old/`

`old/` is left untouched. The mapping:

| `old/` (Clean Architecture) | `new/` (N-Layer) |
| --- | --- |
| `src/core/domain/**` | `src/common/base`, `src/common/type` |
| `src/core/application/services/**` | `src/services/**` |
| `src/infrastructure/persistence/**` | `src/data/**` |
| `src/presentation/api/**` | `src/presentation/api/v1/**` |
| `src/main.ts`, `app.module.ts` | `src/main.ts`, `src/app.module.ts`, `src/app.setup.ts` |
| 4 layers, ~74 files, ~4 900 LOC | 3 layers, fewer files, same conventions |

Bugs fixed in the rewrite:

| `old/` | `new/` |
| --- | --- |
| `synchronize: env === 'production'` | always `false`, migrations only |
| `JWT_SECRET` missing / empty | required, ≥ 32 chars, validated at boot |
| plain-text password comparison | `bcrypt.compare`, cost 12 |
| `isValid()` missing `return false` (×4) | validation delegated to `AppValidationPipe` |
| `ResponseTransformInterceptor` never called `super` | calls it, so `@Expose()` applies |
| interceptor registered twice | once, via `APP_INTERCEPTOR` |
| `filter`/`sort` accepted any column | per-service whitelist, `4007` |
| 4 `RequestContextService` instances (`Scope.REQUEST`) | one singleton on `AsyncLocalStorage` |
| `BaseContext` initialised the pool twice | `TypeOrmModule.forRootAsync` owns the lifecycle |
| no `enableShutdownHooks()` | graceful shutdown on `SIGTERM` |
| `type: 'date'` audit columns (truncated to midnight) | `timestamptz` |
| `JSON.parse(JSON.stringify())` mapping (Dates → strings) | `class-transformer` |
| `price` as `float` | `numeric(12,2)` + transformer |
| `{ … } as any` at every bigint column | `@BigIntColumn()` / `@BigIntPrimaryColumn()` |
| no transactions | `withLockedProduct()` uses `SELECT … FOR UPDATE` |
| `cart` feature referenced an entity that did not exist | removed; `product` demonstrates the pattern |
| unused `ExceptionCode` enum, unused `BaseItemResponse` | deleted |

---

## Toolchain decisions

| Decision | Why |
| --- | --- |
| **NestJS 12** | current major; note it is **ESM-only** |
| **TypeScript 6.0.3** (not 7.x yet) | **Verified empirically, not from peer ranges.** TS 7.0.2 is the native Go port and is 8–12× faster, and `tsc --noEmit` does pass with it — but TS 7.0 ships **only the `tsc` executable, no programmatic compiler API**. Two hard blockers: `nest build` fails with *"The installed TypeScript version (7.0.2) does not expose the programmatic compiler API that the Nest CLI requires… expected to return in 7.1"*, and `typescript-eslint` throws *"does not support TS 7.0"* ([issue #10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940), tracking ≥7.1). Peer ranges of `ts-jest` (`<7`) agree. Re-evaluate when **TypeScript 7.1** lands, since that is what restores the API |
| **TypeORM 1.1.2** (upgraded from 0.3.31) | 1.x is dual CJS/ESM so it does not repeat the NestJS 12 ESM problem, and `@nestjs/typeorm` already accepted `^1.0.0`. The upgrade cost 2 lines of config (`target: ES2023`, the version) and **zero source changes**: the four `as unknown as` casts stayed valid, `MigrationInterface`/`QueryRunner` are unchanged, and 1.x still reads the `migration` table written by 0.3, so no migration history had to be rewritten. Verified end to end: 121 unit + 12 e2e + 36/36 smoke checks, plus a concurrent `adjust-stock` test proving `setLock('pessimistic_write')` still prevents lost updates |
| **`bcryptjs`** | pure JS, so `npm install` never needs a C++ toolchain; identical `$2b$` output |
| **`nestjs-pino`** | structured JSON logs with redaction, hidden behind `ILoggingService` |
| **`AsyncLocalStorage`** instead of `Scope.REQUEST` | request data without re-instantiating the DI graph per request |
| **`--experimental-vm-modules` for Jest** | NestJS 12 ships ESM only; the flag lets Jest 30 use Node's synchronous `require(esm)` for `node_modules` while the project still compiles to CommonJS |
| **Node ≥ 22.13** | the first release where `require(esm)` is enabled by default (how the CommonJS build loads NestJS 12 at runtime) and the floor ESLint 10 declares for the 22 line |
| **ESLint 10** | v9 reached end of life in 2026-08; `typescript-eslint` 8.x already declares `^10.0.0`, and v10 dropped `@eslint/js` from its own dependencies, so it is listed explicitly in `devDependencies` |
| **`no-restricted-imports`** instead of `eslint-plugin-boundaries` | the layer rules are four patterns; one less plugin to keep in sync |

---

## Documentation

| File | Contents |
| --- | --- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | layers, dependency rules, request lifecycle, base classes |
| [`STYLE_GUIDE.md`](./STYLE_GUIDE.md) | naming, DI, JSDoc, error handling, testing conventions |
| [`.clinerules/rule.md`](./.clinerules/rule.md) | condensed rules for AI assisted changes |
| `.agents/skills/senior-backend-typescript-developer/SKILL.md` | the engineering playbook this template follows |
| `src/*/readme.md` | per-layer notes |

---

## License

MIT