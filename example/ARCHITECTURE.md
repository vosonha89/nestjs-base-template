# Architecture

Three layers, one direction of dependency, and a small `common/` + `config/`
foundation. Anything that does not fit one of these folders does not belong in
the codebase.

---

## 1. Layers

```
┌──────────────────────────────────────────────────────────────────┐
│ presentation/   HTTP only                                        │
│   api/v1/<feature>/                                              │
│     <feature>.controller.ts   extends BaseDataController(...)     │
│     <feature>.module.ts       wires controller ⇄ service          │
│     request/*.request.ts      @ApiProperty + class-validator      │
│     response/*.response.ts    Swagger models                      │
└───────────────────────────┬──────────────────────────────────────┘
                            │ depends on (interface + Symbol)
┌───────────────────────────▼──────────────────────────────────────┐
│ services/       business rules, no HTTP, no SQL                  │
│   <feature>/                                                     │
│     <feature>.dto.ts          read model, @Expose() = whitelist    │
│     <feature>.service.ts      extends BaseDataService             │
│     <feature>.service.interface.ts                               │
└───────────────────────────┬──────────────────────────────────────┘
                            │ depends on
┌───────────────────────────▼──────────────────────────────────────┐
│ data/           persistence, no business rules                   │
│   entity/*.entity.ts          TypeORM mapping                    │
│   repository/*.repository.ts  extends PsqlRepository             │
│                               + domain specific queries          │
│   migration/*.ts              generated, reviewed, committed      │
│   seed/*.ts                   idempotent demo data                │
└───────────────────────────┬──────────────────────────────────────┘
                            │ depends on
┌───────────────────────────▼──────────────────────────────────────┐
│ common/                          │ config/                       │
│   base/         BaseDataService, BaseDataController, envelope…    │
│   constant/     ConstantValue, FilterCondition                    │
│   decorator/    Public, Roles, CurrentUser                        │
│   exception/    GlobalError, AppError, AllExceptionFilter         │
│   guard/        JwtAuthGuard, RolesGuard, JwtStrategy             │
│   helper/       ObjectHelper                                      │
│   interceptor/  ResponseTransform, Logging                        │
│   middleware/   CorrelationId                                     │
│   pipe/         AppValidationPipe, ParseEntityIdPipe              │
│   service/      LoggingService, RequestContextService, BcryptHash │
│   type/         UserInfo, RequestWithUser                         │
└──────────────────────────────────────────────────────────────────┘
```

### Dependency rules (enforced by ESLint)

| Folder | May import | Must **not** import |
| --- | --- | --- |
| `src/config` | `@nestjs/*`, `class-validator` | `@common`, `@data`, `@services`, `@presentation` |
| `src/common` | `@config`, libs | `@data`, `@services`, `@presentation` |
| `src/data` | `@common`, `@config`, libs | `@services`, `@presentation` |
| `src/services` | `@common`, `@config`, `@data` | `@presentation` |
| `src/presentation` | `@common`, `@config`, `@services` | **`@data`** |

The rules live in `eslint.config.mjs` as `no-restricted-imports` overrides, so
`npm run lint:check` fails on a violation and a shortcut cannot reach `main`.

> `src/data/data-source.ts` is the only file that builds a `DataSource` without a
> Nest context; it exists for the TypeORM CLI.

---

## 2. Request lifecycle

```
Incoming request
  │
  ├─ CorrelationIdMiddleware      assign/echo x-request-id, open AsyncLocalStorage
  │
  ├─ JwtAuthGuard        (global) verify bearer token, skipped by @Public()
  ├─ RolesGuard          (global) check @Roles(...) when present
  ├─ ThrottlerGuard      (global) per-IP quota, skipped by @SkipThrottle()
  │
  ├─ AppValidationPipe   (global) whitelist + class-validator → ValidationAppError
  │        └─ per-parameter AppValidationPipe({ expectedType }) inside
  │           BaseDataController, because generics are erased at runtime
  │
  ├─ Controller          thin: call the service, wrap the result in an envelope
  │        └─ ObjectHelper.map(request, Dto, { onlyExposed: false })
  │
  ├─ Service             business rules, AppError on failure
  │        └─ repository call / transaction
  │
  ├─ LoggingInterceptor  one access log line (method, url, outcome, duration)
  ├─ ResponseTransformInterceptor  @Expose() projection, Date → ISO, array holes → null
  │
  └─ AllExceptionFilter  (only on throw) one envelope + matching HTTP status
```

Guard order matters: authentication first, authorisation second, so `RolesGuard`
always sees a resolved principal.

`ThrottlerGuard` runs **after** the two auth guards on purpose. A request
rejected with `401` never consumes the caller's quota, so an attacker cannot lock
a legitimate user out of a shared NAT IP by spamming garbage tokens. Public
routes (`@Public()`) still pass through `JwtAuthGuard` and are therefore still
counted, which is what protects `/auth/login` from credential stuffing.
`/health` opts out with `@SkipThrottle()` — a probe every few seconds must never
be able to turn into `429` and pull the pod out of the load balancer.

`THROTTLE_TTL` is expressed in **seconds** (`app.throttleTtl`), and
`CommonModule` converts it with the `seconds()` helper because
`@nestjs/throttler` v6 expects **milliseconds**. The conversion lives in one
place so a unit mistake cannot silently disable limiting.

---

## 3. The base classes

Four pieces do most of the work. Read them once and every feature becomes
predictable.

### `BaseDataService<TDto, TEntity, TId>`

An **abstract generic class**, not a factory, because a service needs no
per-subclass runtime types inside decorators.

```ts
@Injectable()
export class UserService
  extends BaseDataService<UserDto, UserEntity, number>
  implements IUserService {
  public constructor(
    @Inject(RequestContextServiceSymbol) context: IRequestContextService,
    @Inject(UserRepositorySymbol) private readonly userRepository: UserRepository,
    @Inject(HashServiceSymbol) private readonly hashService: IHashService
  ) {
    super(context, userRepository, {
      dto: UserDto,
      entity: UserEntity,
      searchableFields: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt']
    });
  }
}
```

It provides `findById`, `findBy`, `create`, `update`, `delete`, `exists`,
`existsBy`, and owns three guarantees:

1. **filter/sort whitelist** — `searchableFields` / `sortableFields`; a field
   outside the list raises `AppError` `4007`;
2. **entity → DTO projection** — `ObjectHelper.map(entity, dto)` with
   `excludeExtraneousValues`, so only `@Expose()` fields can leave;
3. **deterministic pagination** — `id` is appended as a tie breaker.

### `BaseDataController(...)` factory

A **factory**, not a class, because Swagger and `AppValidationPipe` need the
concrete request classes at class-definition time, which a generic type
parameter cannot provide.

```ts
@ApiTags('user')
@Controller({ path: 'user', version: '1' })
export class UserController extends BaseDataController<
  UserDto, number,
  UserSearchRequest, UserCreateRequest, UserUpdateRequest, UserDeleteRequest,
  IUserService                                     // ← widens `dataService`
>(UserDto, UserSearchRequest, UserCreateRequest, UserUpdateRequest, UserDeleteRequest) {
  public constructor(
    @Inject(LoggingServiceSymbol) loggingService: ILoggingService,
    @Inject(RequestContextServiceSymbol) context: IRequestContextService,
    @Inject(UserServiceSymbol) dataService: IUserService
  ) {
    super(loggingService, context, dataService);
  }
}
```

The 7th type parameter is optional; pass the feature interface when the
controller adds endpoints (`ProductController` does, for `adjust-stock`).

Status codes come from the base — `200` for search/get/put/delete, `201` for
create — and `@HttpCode` is always set explicitly, never left to the framework
default.

### `BaseResponse<T>` / `ErrorResponse`

The envelope. `status` mirrors the transport status, `successful` is explicit,
and `exception` only exists on failure. Factories (`OKResponse`,
`CreatedResponse`, `NotFound()`, …) keep controllers free of literal numbers.

### `BaseType<TId>` / `BaseEntity<TId>` / `PsqlEntity<TId>`

`BaseType` is the DTO contract, `BaseEntity` the storage-agnostic contract, and
`PsqlEntity` adds `@CreateDateColumn` / `@UpdateDateColumn` / `@DeleteDateColumn`
as `timestamptz` plus soft delete.

---

## 4. Error handling

One filter, one envelope, one catalogue.

```
throw new AppError(HttpStatus.CONFLICT, new ClientError('409', 'Email already registered.'))
throw ValidationAppError        ← AppValidationPipe
throw new QueryFailedError      ← TypeORM (unique violation → 409, otherwise 500)
```

`AllExceptionFilter` maps:

| Thrown | Result |
| --- | --- |
| `AppError` | its own `httpStatus` + `exception` |
| `ValidationAppError` | `400` + `400x` code |
| `HttpException` (Nest, passport, throttler) | mapped by status |
| `QueryFailedError` `23505` / `23503` | `409` |
| anything else | `500`, message masked, stack only in the log |

---

## 5. Persistence

- **Migrations only.** `synchronize` is hard-coded `false` inside
  `buildDataSourceOptions`. Generate with
  `npm run migration:generate -- src/data/migration/Name`, review the SQL, commit.
- **`BIGSERIAL`/identity bigints stay JS numbers** through
  `@BigIntPrimaryColumn()`. That transformer is the only casting point.
- **Money is `numeric(12,2)`** with `numericTransformer`, never `float`.
- **Soft delete** via `@DeleteDateColumn`: `find`/`count` skip deleted rows
  automatically, and the query builder in `UserRepository.findByEmail` filters
  `deletedAt IS NULL` explicitly because builders bypass the listener.
- **A transaction belongs to the repository method that locks the row**
  (`withLockedProduct`). The service describes *what* to change; the repository
  guarantees it happens atomically.
- **`select: false` for secrets.** `UserRepository.findByEmail` re-adds the
  column with `addSelect`, and it is the only place the hash is loaded.

---

## 6. Configuration

`src/config` is the only place that reads `process.env`:

1. `AppConfigModule` loads `env/.env.${NODE_ENV}`, falling back to
   `env/.env.development`.
2. `validateEnvironment` runs `class-validator` over the whole file and throws
   **one** error listing every problem.
3. `appConfig` / `dbConfig` / `jwtConfig` (`registerAs`) expose typed namespaces.
4. Everything else injects `ConfigService` and calls
   `getOrThrow<IAppConfig>('app')` — never `process.env`.

`synchronize` is not configurable on purpose.

---

## 7. Cross-cutting services

| Service | Symbol | Why a Symbol |
| --- | --- | --- |
| `LoggingService` | `LoggingServiceSymbol` | interface-first DI, trivially stubbable |
| `RequestContextService` | `RequestContextServiceSymbol` | same, and it is a singleton |
| `BcryptHashService` | `HashServiceSymbol` | swap bcrypt for argon2 by changing one provider |

`CommonModule` is `@Global()` and registers every `APP_*` provider exactly once:
the pipe, both guards, both interceptors, the filter, plus `JwtModule`,
`PassportModule` and `LoggerModule`. Feature modules therefore contain **only**
their controller and service.

### Why `AsyncLocalStorage`

`Scope.REQUEST` re-creates the whole injection sub-tree on every request and, in
the original template, produced four independent `RequestContextService`
instances that disagreed with each other. `AsyncLocalStorage` exposes the same
data from a singleton:

```ts
this.context.getRequestId();
this.context.getUser();
this.context.getLanguage();
```

---

## 8. Adding a feature

One command:

```bash
npm run generate:feature -- --name order --fields "code:string:unique,total:numeric(12,2),stock:integer,note:text:optional"
npm run format
npm run migration:generate -- src/data/migration/AddOrder   # review the SQL
npm run migration:run
```

It writes twelve files:

```
src/data/entity/<name>.entity.ts
src/data/repository/<name>.repository.ts
src/services/<name>/<name>.dto.ts
src/services/<name>/<name>.service.interface.ts
src/services/<name>/<name>.service.ts
src/services/<name>/<name>.service.spec.ts
src/presentation/api/v1/<name>/request/<name>-create.request.ts
src/presentation/api/v1/<name>/request/<name>-update.request.ts
src/presentation/api/v1/<name>/request/<name>-search.request.ts
src/presentation/api/v1/<name>/response/<name>-search.response.ts
src/presentation/api/v1/<name>/<name>.controller.ts
src/presentation/api/v1/<name>/<name>.module.ts
```

and edits exactly **two** files: `src/data/feature.registry.ts` and
`src/presentation/feature.registry.ts`.

Doing it by hand is the same list, with the registry edits replacing the five
places the old template required:

| What you add | File |
| --- | --- |
| the entity | `src/data/feature.registry.ts` → `ENTITIES` |
| the repository provider and its export | same file → `REPOSITORY_PROVIDERS`, `REPOSITORY_EXPORTS` |
| the module | `src/presentation/feature.registry.ts` → `FEATURE_MODULES` |
| the Swagger tag | same file → `SWAGGER_TAGS` |

`src/data/data-source-options.ts`, `src/data/database.module.ts`,
`src/presentation/presentation.module.ts` and `src/main.ts` are never touched
again. That is what lets every app built on this template share them verbatim.

If a step forces you to edit `src/common/`, the abstraction is missing
something — fix it there, not in the feature.

---

## 9. Deliberate trade-offs

| Trade-off | Reason |
| --- | --- |
| DTO is an output projection, request is a separate class | a create payload has a `password`, a response never does; separating them removes the `as any` casts the old code needed |
| Controllers instantiate no request objects | `BaseDataController` uses `AppValidationPipe({ expectedType })` because generics are erased; the alternative was `@Body() req: any` |
| `ObjectHelper.map(..., { onlyExposed: false })` for request → DTO | the payload was already sanitised by `whitelist`; re-applying `@Expose` would strip the password before it can be hashed |
| `Paginated.totalRecord` computed only when `count: true` | the extra query is opt-in, and `hasMore` is still accurate from `elements.length` |
| `no-restricted-imports` instead of `eslint-plugin-boundaries` | four patterns are enough and it needs no extra dependency |
| `require(esm)` instead of an ESM build | no `.js` suffixes on relative imports, `nest build` stays CommonJS, Jest needs one flag |