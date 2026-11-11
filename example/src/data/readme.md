# `src/data` — persistence

TypeORM entities, repositories, migrations and seed. **No business rules** —
only the row lock and the transaction that belongs to it.

| Folder | Contents |
| --- | --- |
| `entity/` | `PsqlEntity` (audit columns, soft delete). No concrete entity ships. |
| `repository/` | `PsqlRepository` (generic CRUD). No concrete repository ships. |
| `context/` | `BaseContext` (port), `PsqlContext` (facade over `DataSource`) |
| `decorator/` | `@BigIntColumn()`, `@BigIntPrimaryColumn()`, `numericTransformer` |
| `migration/` | generated, reviewed, committed |
| `seed/` | `ISeeder` contract, `SeedService` + `run-seed.ts` (idempotent) |
| `feature.registry.ts` | `ENTITIES`, `REPOSITORY_PROVIDERS`, `REPOSITORY_EXPORTS` |
| `data-source-options.ts` | `buildDataSourceOptions()`, shared with the CLI |
| `data-source.ts` | the `DataSource` the TypeORM CLI uses |
| `database.module.ts` | `@Global()` — `TypeOrmModule.forRootAsync` + registry providers |

## Conventions

- **`synchronize` is always `false`.** Schema changes go through
  `npm run migration:generate -- src/data/migration/Name`, then review, then
  `npm run migration:run`.
- Audit columns are `timestamptz` with `now()` defaults — never `date`, which
  would truncate to midnight.
- Money is `numeric(12,2)` + `numericTransformer`; never `float`.
- bigint identifiers are exposed as JS numbers through
  `@BigIntPrimaryColumn()`; that transformer is the only cast in the codebase.
- A secret column declares `select: false` and is re-added explicitly with
  `addSelect` in one named repository method.
- Uniqueness is enforced by a database index, not a pre-flight `SELECT`.
- `@DeleteDateColumn` = soft delete; `find`/`count` skip deleted rows
  automatically, query builders do not, so they filter `deletedAt IS NULL`
  manually.
- A read-then-write rule locks the row inside a transaction: the repository owns
  a `withLocked…` method, the service owns the rule (see the example's
  `adjustStock`).
- Every repository is listed in `src/data/feature.registry.ts` and exported
  through its `<Name>RepositorySymbol`. `database.module.ts` reads that registry
  and is never edited again.

## Adding an entity

```bash
npm run generate:feature -- --name <name> --fields "…"
```

Or by hand:

1. create `entity/<name>.entity.ts` extending `PsqlEntity<number>`
2. add it to `ENTITIES` in `feature.registry.ts`
3. generate + review + run the migration
4. create `repository/<name>.repository.ts` extending `PsqlRepository`
5. add the provider and the export to `feature.registry.ts`

## Rules

Must not import `@services` or `@presentation` — ESLint enforces it.