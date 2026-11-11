# `src/services` — business layer

Business rules, DTOs and the interfaces the controllers depend on. No HTTP, no
SQL.

| Feature | Files |
| --- | --- |
| `<feature>/` | `<feature>.dto.ts`, `<feature>.service.interface.ts`, `<feature>.service.ts`, `<feature>.service.spec.ts` |

No service ships with the template. `example/src/services/` shows `auth`,
`user` and `product`, including a service that hashes a secret field and one
that orchestrates a locked read-then-write.

## Anatomy of a service

```ts
@Injectable()
export class <Name>Service
  extends BaseDataService<<Name>Dto, <Name>Entity, number>
  implements I<Name>Service {

  public constructor(
    @Inject(RequestContextServiceSymbol) requestContext: IRequestContextService,
    @Inject(<Name>RepositorySymbol) protected readonly <name>Repository: <Name>Repository
  ) {
    super(requestContext, <name>Repository, {
      dto: <Name>Dto,
      entity: <Name>Entity,
      searchableFields: ['id', 'name', 'isActive', 'createdAt'],
      sortableFields: ['id', 'name', 'createdAt'],
      defaultSortField: 'id',
      defaultSortDirection: 'DESC'
    });
  }
}
```

The `super(...)` call is the contract: which DTO leaves, which entity backs it,
and **which columns a client may filter or sort on**. Everything else is
inherited.

## Rules

- `searchableFields` is a **security whitelist**. Anything not listed is a
  `4007`; never widen it to `Object.keys(entity)`.
- Override a base method only to add a rule, then delegate with `super.*` — the
  example's `UserService.create` hashes the password, its `update` refuses to
  overwrite a field with an empty string.
- Business errors are `AppError` with a `GlobalError` code. Never a bare
  `Error`, never an HTTP response.
- A DTO field needs `@Expose()` to be returned. A field accepted on input but
  never returned simply has none (the example's `UserDto` has no `password`).
- Passwords are hashed with `HashServiceSymbol`; never compare plain text.
- A read-then-write rule that lives in the repository (row lock) is orchestrated
  here — the example's `ProductService.adjustStock` validates the delta and the
  resulting quantity while `ProductRepository.withLockedProduct` owns the
  transaction.
- Must not import `@presentation` — ESLint enforces it.

## Tests

`*.spec.ts` beside the service, built through `Test.createTestingModule` with
`{ provide: <Name>Symbol, useValue: mock }` for every dependency. Assert the
contract: error code, absence of `password`, arguments passed to the repository.