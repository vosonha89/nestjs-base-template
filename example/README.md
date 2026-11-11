# Example application

This folder **is** [`template/`](../template) plus a demo domain. Nothing else.

It exists to answer one question: *what does an app built on this template
actually look like?* Every file here is either a byte-identical copy of the
template (enforced by CI) or one of a handful of declared extension points.

```bash
cp .env.example env/.env.development   # or use the values already committed there
docker compose up -d
npm install
npm run migration:run
npm run seed
npm run start:dev
```

| Endpoint | URL |
| --- | --- |
| API base | `http://localhost:3001/api/v1` |
| Swagger UI | `http://localhost:3001/api/doc` |
| Health probe | `http://localhost:3001/health` |

Seeded accounts:

| Email | Password | Role |
| --- | --- | --- |
| `admin@demo.io` | `Admin@12345` | `admin` |
| `user@demo.io` | `User@12345` | `user` |

---

## What is copied, what is owned

`tools/core-manifest.json` is the contract. Three buckets:

| Bucket | Count | Rule |
| --- | --- | --- |
| **core** | 106 files | Copied from `template/`. **Never edit here** — `npm run verify:sync` fails CI. |
| **diverge** | 3 files | Owned by each folder, see below. |
| **example-only** | the demo domain | Cannot exist in the template. |

### The three declared extension points

These are the only files where `example/` legitimately differs from
`template/`. They are the same three files you edit in a real application.

| File | `template/` | `example/` |
| --- | --- | --- |
| `src/data/feature.registry.ts` | `ENTITIES = []`, no repositories | `[UserEntity, ProductEntity]` + 2 repositories |
| `src/presentation/feature.registry.ts` | `FEATURE_MODULES = []`, `SWAGGER_TAGS = ['health']` | `[AuthModule, UserModule, ProductModule]`, 4 tags |
| `src/data/seed/seed.registry.ts` | `SEEDERS = []` | `[UserSeeder, ProductSeeder]` |

Adding a feature in a real app therefore touches **one file** plus the new
feature's own folder — that is the whole point of the registry indirection.

### The demo domain

Everything below is the example's own code, and is exactly what you would write
in your application:

```
src/data/entity/user.entity.ts            src/data/entity/product.entity.ts
src/data/repository/user.repository.ts    src/data/repository/product.repository.ts
src/data/migration/1794258271190-InitSchema.ts
src/data/seed/seeder/user.seeder.ts       src/data/seed/seeder/product.seeder.ts
src/services/{auth,user,product}/
src/presentation/api/v1/{auth,user,product}/
test/app.e2e-spec.ts                      test/throttle.e2e-spec.ts
```

### Reading order

If you are learning the template, read these in order — each demonstrates one
idea from [`ARCHITECTURE.md`](../template/ARCHITECTURE.md):

| File | Demonstrates |
| --- | --- |
| `src/services/user/user.service.ts` | extending `BaseDataService`, hashing a secret field |
| `src/data/repository/user.repository.ts` | `select: false` + the one query that re-adds it |
| `src/services/auth/auth.service.ts` | business logic out of the controller, no user enumeration |
| `src/presentation/api/v1/product/product.controller.ts` | a non-CRUD endpoint (`adjust-stock`) |
| `src/data/repository/product.repository.ts` | `SELECT … FOR UPDATE` inside a transaction |
| `test/app.e2e-spec.ts` | the full stack through `configureApplication()` |

---

## Commands

Identical to the template. See [`../template/README.md`](../template/README.md).

## Golden rule

> If you need to change a **copied** file, change it in `template/` first, then
> run `npm run sync` from the repository root.

The CI job `sync-guard` enforces this. It is the only thing that stops the two
folders drifting apart.