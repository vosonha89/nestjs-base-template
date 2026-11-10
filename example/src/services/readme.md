# `src/services` — business layer

Business rules, DTOs and the interfaces the controllers depend on. No HTTP, no
SQL.

| Feature | Files |
| --- | --- |
| `auth/` | `auth.dto.ts` (`AuthTokenDto`), `auth.service.interface.ts`, `auth.service.ts` |
| `user/` | `user.dto.ts`, `user.service.interface.ts`, `user.service.ts` |
| `product/` | `product.dto.ts`, `product.service.interface.ts`, `product.service.ts` |

## Anatomy of a service

```ts
@Injectable()
export class UserService
  extends BaseDataService<UserDto, UserEntity, number>
  implements IUserService {

  public constructor(
    @Inject(RequestContextServiceSymbol) requestContext: IRequestContextService,
    @Inject(UserRepositorySymbol) private readonly userRepository: UserRepository,
    @Inject(HashServiceSymbol) private readonly hashService: IHashService
  ) {
    super(requestContext, userRepository, {
      dto: UserDto,
      entity: UserEntity,
      searchableFields: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt']
    });
  }

  public async validateUser(email: string, password: string): Promise<UserDto | null> {
    // …
  }
}
```

The `super(...)` call is the contract: which DTO leaves, which entity backs it,
and **which columns a client may filter or sort on**. Everything else is
inherited.

## Rules

- `searchableFields` is a **security whitelist**. Anything not listed is a
  `4007`; never widen it to `Object.keys(entity)`.
- Override a base method only to add a rule, then delegate with `super.*` —
  `UserService.create` hashes the password, `UserService.update` refuses to
  overwrite with an empty string.
- Business errors are `AppError` with a `GlobalError` code. Never a bare
  `Error`, never an HTTP response.
- A DTO field needs `@Expose()` to be returned. A field accepted on input but
  never returned simply has none (`UserDto.password`).
- Passwords are hashed with `HashServiceSymbol`; never compare plain text.
- A read-then-write rule that lives in the repository (row lock) is orchestrated
  here, e.g. `ProductService.adjustStock` validates the delta and the resulting
  quantity while `ProductRepository.withLockedProduct` owns the transaction.
- Must not import `@presentation` — ESLint enforces it.

## Tests

`*.spec.ts` beside the service, built through `Test.createTestingModule` with
`{ provide: <Name>Symbol, useValue: mock }` for every dependency. Assert the
contract: error code, absence of `password`, arguments passed to the repository.