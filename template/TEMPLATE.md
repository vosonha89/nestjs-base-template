# What this template gives you — and what it does not

Read this before your first commit. It answers the two questions every new app
has: *what is already decided for me?* and *what am I expected to write myself?*

---

## 1. Already decided — do not re-implement

| Concern | Where | Notes |
| --- | --- | --- |
| Response envelope | `src/common/base/base.response.ts` | `serverDateTime / status / msg / successful / data? / exception?` |
| Error catalogue | `src/common/exception/global-error.ts` | `4001`–`4008`, factory functions, no magic strings |
| Exception filter | `src/common/exception/all-exception.filter.ts` | registered once, globally |
| Validation | `src/common/pipe/app-validation.pipe.ts` | whitelist, `forbidNonWhitelisted`, numeric codes |
| Auth | `src/common/guard/jwt-auth.guard.ts` + `jwt.strategy.ts` | global; opt out with `@Public()` |
| Authorisation | `src/common/guard/roles.guard.ts` | opt in with `@Roles('admin')` |
| Rate limiting | `src/common/common.module.ts` | global; opt out with `@SkipThrottle()` |
| Logging | `src/common/service/logging.service.ts` | pino, redacted, one access line per request |
| Request context | `src/common/service/request-context.service.ts` | `AsyncLocalStorage`, singleton, never `Scope.REQUEST` |
| CRUD + search | `src/common/base/base-data.service.ts` | filters, sort, pagination, whitelists |
| CRUD HTTP surface | `src/common/base/base-data.controller.ts` | 5 endpoints per feature, Swagger included |
| Entity plumbing | `src/data/entity/psql.entity.ts` | `timestamptz` audit columns, soft delete |
| Repository plumbing | `src/data/repository/psql.repository.ts` | 9 generic methods |
| bigint / money mapping | `src/data/decorator/bigint-column.decorator.ts` | the only unavoidable cast, in one place |
| Migrations | `src/data/data-source.ts` | `synchronize` hard-coded `false` |
| Config | `src/config/**` | validated at boot, typed namespaces |
| Layer boundaries | `eslint.config.mjs` | `presentation` cannot import `@data/*` |
| Health probe | `src/presentation/api/v1/health` | unversioned, outside the prefix, never throttled |
| Feature scaffolder | `tools/generate-feature.mjs` | 12 files + registry wiring |

---

## 2. You must write

| Concern | Why it cannot be templated |
| --- | --- |
| **The `auth` module** | the template ships no user entity. `JwtAuthGuard` is wired, but nothing issues a token until you add a login endpoint. |
| The first entity | the registry is empty on purpose; a template inventing a domain is a template you delete. |
| Domain rules | anything that reads a value and then writes based on it belongs in a service, and often needs a repository method holding the lock. |
| Env variables for your integrations | add to three places (see §4). |
| Deployment target | the Dockerfile is a starting point, not a manifest. |

---

## 3. Adding a feature

```bash
npm run generate:feature -- --name order --fields "code:string:unique,total:numeric(12,2),stock:integer,note:text:optional"
```

Field grammar:

| Type | Column | Validators |
| --- | --- | --- |
| `string` | `text` | `IsString`, `MinLength(1)`, `MaxLength(255)` |
| `text` | `text` | `IsString`, `MaxLength(4000)` |
| `integer` | `integer` | `IsInt`, `Min(0)` |
| `numeric(p,s)` | `numeric(p,s)` + `numericTransformer` | `IsNumber({ maxDecimalPlaces: s })`, `Min(0)` |
| `boolean` | `boolean` | `IsBoolean` |
| `timestamptz` | `timestamptz` (nullable) | `IsDateString` |

Modifiers, joined with `+`: `unique` (adds a unique index), `optional` (nullable
column, `IsOptional` on create).

Then:

```bash
npm run format
npm run migration:generate -- src/data/migration/AddOrder   # REVIEW the SQL
npm run migration:run
npm run lint:check && npm run typecheck && npm run test:cov
```

The generator refuses to overwrite existing files, and registers the feature in
both registries. If you need a non-CRUD endpoint (like `POST /:id/adjust-stock`
in the example), add the method to the controller and the rule to the service —
that is the whole pattern.

---

## 4. Adding an environment variable

Three places, or the app will not boot (or will boot with the wrong value):

1. `src/config/env.validation.ts` — the `@Is…` schema
2. `src/config/configuration.ts` — the `readX('NAME', default)` call in the right
   namespace
3. `.env.example` — the documented template

Then `src/config/config.type.ts` if you added a new namespace field.

---

## 5. Adding an error code

`4001`–`4007` are the validation family and are produced automatically by
`AppValidationPipe`. `4008` is the escape hatch for a domain rule:

```ts
const message = GlobalError.BusinessRuleError('Insufficient stock', 'available 3, requested 5');
throw new AppError(HttpStatus.BAD_REQUEST, new ClientError(String(message.code), message.msg));
```

Do not add a new numeric family unless a client genuinely needs to branch on it.
A plain HTTP status (`404`, `409`) is usually the right answer.

---

## 6. Checklist before production

- [ ] `JWT_SECRET` is ≥ 32 random characters, generated per environment
- [ ] `SWAGGER_ENABLED=false`
- [ ] `CORS_ORIGINS` is a concrete list, not `*`
- [ ] `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=true` for a managed database
- [ ] `env/.env.*` is not committed (check `git ls-files | grep env/`)
- [ ] every migration has been read, not just generated
- [ ] `npm run lint:check && npm run typecheck && npm run test:cov` all pass
- [ ] coverage thresholds were not lowered to get there
- [ ] the seed does not contain real credentials
- [ ] `/health` is reachable and excluded from auth and throttling
- [ ] `scripts/init-app.sh` no longer exists

---

## 7. Things that look wrong but are not

| Looks odd | Why |
| --- | --- |
| `BaseDataController` is a factory, not an abstract class | generics are erased at runtime, and Swagger plus `AppValidationPipe` need the concrete request classes |
| `ObjectHelper.map(..., { onlyExposed: false })` on create | the body was already sanitised by `whitelist`; re-applying `@Expose` would strip `password` before it can be hashed |
| three separate registry files | one per layer keeps the ESLint boundary rules intact |
| `no-restricted-imports` instead of a boundaries plugin | four patterns, zero extra dependencies |
| `require(esm)` rather than an ESM build | no `.js` suffixes on relative imports, `nest build` stays CommonJS |
| TypeScript pinned below 7.x | 7.0 dropped the programmatic compiler API that `nest build` needs |