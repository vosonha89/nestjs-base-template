# Style Guide

The conventions below are the ones the template actually enforces — ESLint,
`tsc` and Prettier fail the build when they are broken. They are the same
conventions the original `old/` codebase followed; only the ceremony was reduced.

---

## 1. Formatting

| Rule | Value |
| --- | --- |
| indentation | **tabs**, width 4 (`.editorconfig`, Prettier) |
| quotes | single |
| semicolons | required |
| trailing commas | none |
| print width | 120 |
| line endings | LF |
| JSON / YAML / Markdown | 2 spaces (Prettier override) |

`npm run format` before committing; `npm run format:check` runs in CI.

---

## 2. Naming

| Kind | Convention | Example |
| --- | --- | --- |
| folder | singular, lower case | `user`, `product`, `auth` |
| interface | `I` prefix | `IUserService`, `IBaseRepository` |
| type alias | descriptive, no prefix | `FilterValue`, `SortDirection` |
| class | PascalCase | `UserService` |
| file | dot separated, lower case | `user.service.ts`, `user-create.request.ts` |
| spec | mirrors the file | `user.service.spec.ts` |
| DI symbol | `<Name>Symbol` | `UserServiceSymbol` |
| constant | `SCREAMING_SNAKE` for primitives | `IS_PUBLIC_KEY` |
| constant class | PascalCase static readonly | `ConstantValue.PAGE_SIZE` |

File suffixes carry meaning:

```
*.entity.ts      TypeORM entity
*.repository.ts  data access
*.dto.ts         service read model (output)
*.request.ts     controller input (validated)
*.response.ts    Swagger model
*.service.ts     business service
*.service.interface.ts
*.controller.ts
*.module.ts
*.guard.ts  *.pipe.ts  *.interceptor.ts  *.filter.ts  *.middleware.ts
*.strategy.ts  *.decorator.ts  *.helper.ts
```

One public export per file. No barrel `index.ts` files — they hide cycles and
break `import type` elimination.

---

## 3. Classes and members

```ts
@Injectable()
export class UserService implements IUserService {
	/** Request scoped data, see {@link IRequestContextService}. */
	protected readonly context: IRequestContextService;

	/** DTO class, used to map entities on the way out. */
	private readonly dtoType: Type<UserDto>;

	/**
	 * Constructor
	 * @param requestContext - Service exposing the current request
	 * @param userRepository - Repository for user data access
	 */
	public constructor(
		@Inject(RequestContextServiceSymbol) requestContext: IRequestContextService,
		@Inject(UserRepositorySymbol) private readonly userRepository: UserRepository
	) {
		this.context = requestContext;
	}

	/**
	 * Verifies an email / password pair.
	 * @param email - Email address supplied by the caller
	 * @param password - Plain text password supplied by the caller
	 * @returns The user without sensitive fields, or `null` when invalid
	 */
	public async validateUser(email: string, password: string): Promise<UserDto | null> {
		// …
	}
}
```

Rules:

- **explicit access modifier on every member**, including the constructor
  (`@typescript-eslint/explicit-member-accessibility: error`);
- **explicit return type on every function** — the only exception is the
  `BaseDataController` factory, documented in `ARCHITECTURE.md`;
- `protected constructor` on abstract base classes that must not be built
  directly;
- `readonly` on injected collaborators and on config objects;
- JSDoc on every exported class, interface, method and non-obvious field, with
  `@param` / `@returns` / `@throws`;
- `abstract override` when a subclass re-declares an abstract member
  (`noImplicitOverride` is on).

---

## 4. Dependency injection

Depend on an **interface + Symbol**, never on a class when a port exists:

```ts
export const UserServiceSymbol = Symbol('UserService');   // next to the class

// consumer
public constructor(@Inject(UserServiceSymbol) private readonly userService: IUserService) {}
```

The Symbol lives in the implementation file, next to the class it identifies, so
importing the token never requires a separate constants file.

Register every cross-cutting provider **once**, in `CommonModule` (global).
Feature modules declare only their own controller and service.

Never use `Scope.REQUEST`. Use `IRequestContextService` (backed by
`AsyncLocalStorage`) instead — same data, no per-request DI sub-tree.

---

## 5. Validation and mapping

Request classes:

```ts
export class UserCreateRequest extends BaseCreateRequest {
	@ApiProperty({ description: 'Login email address', example: 'jane@demo.io' })
	@IsNotEmpty({ message: 'email is required' })
	@IsEmail({}, { message: 'email must be a valid email address' })
	@MaxLength(255)
	public email!: string;
}
```

- every required field carries `@IsNotEmpty()` so a missing value maps to `4001`;
- password length is capped at 72 because bcrypt silently truncates beyond that;
- an unconstrained-but-allowed property uses `@Allow()` (see `BaseFilter.fieldValue`),
  otherwise `forbidNonWhitelisted` rejects it.

DTOs:

```ts
export class UserDto extends BaseType<number> {
	@Expose()
	@ApiProperty({ example: 1 })
	public id!: number;

	/** Write-only password: deliberately has no `@Expose()`. */
	public password?: string;
}
```

- **every exposed field gets `@Expose()`** — that decorator *is* the whitelist;
- a field that must be accepted from a request but never returned simply has no
  `@Expose()`;
- mapping: `ObjectHelper.map(entity, UserDto)` (entity → DTO, whitelisted) or
  `ObjectHelper.map(request, UserDto, { onlyExposed: false })` (already
  sanitised payload).

Never `JSON.parse(JSON.stringify(x))` — it turns `Date` into `string` and drops
`undefined` silently.

---

## 5b. Rate limiting

`ThrottlerGuard` is registered globally in `CommonModule`. Two rules:

- opt **out** only where a probe or an internal caller legitimately polls —
  `@SkipThrottle()` on `/health` is the only such place today;
- when a route needs a different budget, use the decorator
  (`@Throttle({ default: { limit, ttl } })`) rather than editing the global
  value. `ttl` there is in **milliseconds**; the env var is in **seconds**.

---

## 6. Errors

Raise `AppError` with a code from `GlobalError`; never `throw new Error(...)` in
business code, and never build an HTTP response inside a service.

```ts
const message = GlobalError.InsufficientQuantityError(entity.stock, Math.abs(delta));
throw new AppError(HttpStatus.BAD_REQUEST, new ClientError(String(message.code), message.msg));
```

- new codes go into `GlobalError` (`4001`–`4008` are taken);
- messages are user facing and English;
- a `500` never carries the internal message to the client;
- log with `ILoggingService`, never `console.*`.

---

## 7. Logging

```ts
this.loggingService.info('Created user', 'SeedService', { userId: user.id });
this.loggingService.error('Failed to seed', error, 'SeedService', { requestId });
```

- `context` is the class name;
- `meta` is a flat object, correlation id first;
- **never** log a token, password, cookie, full request body or connection
  string — `pino` redacts the common paths, but do not rely on it alone.

---

## 8. Database

- every schema change is a migration; `synchronize` is always `false`;
- migrations are generated, then **reviewed** — check the SQL, the column types
  and the indexes;
- audit columns use `timestamptz` (never `date`);
- money uses `numeric(p,s)` plus `numericTransformer` (never `float`);
- bigint identifiers use `@BigIntColumn()` / `@BigIntPrimaryColumn()`;
- secrets use `select: false` and are loaded only through an explicit
  `addSelect`;
- uniqueness is enforced by a database index and surfaced as `409`, not by a
  pre-flight `SELECT` that races;
- a transaction lives in the repository method that takes the row lock.

---

## 9. Tests

```ts
describe('UserService', () => {
	let service: UserService;
	let userRepository: jest.Mocked<Pick<UserRepository, 'findByEmail'>>;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: RequestContextServiceSymbol, useValue: createRequestContextMock() },
				{ provide: UserRepositorySymbol, useValue: userRepository }
			]
		}).compile();

		service = moduleRef.get(UserService);
	});

	it('should return null when the password does not match', async () => {
		// …
	});
});
```

- `*.spec.ts` next to the file under test; `test/*.e2e-spec.ts` for the API;
- test names start with `should`;
- build the subject through `Test.createTestingModule` so the DI wiring is
  covered too; instantiate directly only for pure functions;
- mock the port (interface + Symbol), never the ORM;
- assert on the *contract* — the error code, the absence of `password`, the
  generated `where` clause — not on implementation details;
- shared stubs live in `test/support/test-doubles.ts`;
- a unit test never touches a real database; the e2e suite does.

---

## 10. Forbidden

| Never | Because |
| --- | --- |
| `any` | `@typescript-eslint/no-explicit-any: error` |
| `@ts-ignore` without a linked issue | hides a real problem |
| `console.log` | use `ILoggingService` |
| `process.env` outside `src/config` | config is validated once, at boot |
| `synchronize: true` | can drop production tables |
| importing `@data/*` from `presentation` | ESLint layer rule |
| `Scope.REQUEST` | use `AsyncLocalStorage` |
| business logic in a controller | that is the service's job |
| HTTP decorators in a service | that is the controller's job |
| returning an entity from a controller | always map to a DTO |
| `SELECT`-then-`INSERT` for uniqueness | use a unique index + `409` |