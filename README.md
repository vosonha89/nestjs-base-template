# NestJS API Template

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/XezpwfPi1US9RhS159vdjh/Xkysgexu81sGiFtzJyFTrK/tree/main.svg?style=svg)](https://app.circleci.com/pipelines/github/vosonha89/nestjs-base-template?branch=main)
[![CI](https://github.com/vosonha89/nestjs-base-template/actions/workflows/ci.yml/badge.svg)](https://github.com/vosonha89/nestjs-base-template/actions/workflows/ci.yml)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fvosonha89%2Fnestjs-base-template.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fvosonha89%2Fnestjs-base-template?ref=badge_shield)

A production-ready **N-layer** NestJS API: `Controller → Service → Repository`,
TypeORM migrations, JWT authentication, one frozen response envelope, and an
error catalogue clients can branch on.

Two folders, one of which you copy:

| Folder | What it is | Use it for |
| --- | --- | --- |
| [`template/`](./template) | The template. No domain code, no demo data. Boots with an empty entity list. | **Start here.** Copy this to begin a new app. |
| [`example/`](./example) | That exact template plus `user`, `product` and `auth`. | Read it to see how a feature is supposed to look. |
| [`tools/`](./tools) | Repository tooling: sync guard, secret scan, feature generator. | Not shipped to a consumer. |

---

## Start a new app

```bash
# Option A — GitHub "Use this template" button, then:
./scripts/init-app.sh --name my-order-api --port 3002 --db my_order_db

# Option B — degit, no git history
npx degit <owner>/nestjs-base-template/template my-order-api
cd my-order-api
./scripts/init-app.sh --name my-order-api --port 3002 --db my_order_db

# Then, in both cases:
npm install
docker compose up -d
npm run generate:feature -- --name order --fields "code:string:unique,total:numeric(12,2)"
npm run migration:generate -- src/data/migration/AddOrder && npm run migration:run
npm run start:dev
```

`init-app.sh` renames the package, the env `APP_NAME`, the Swagger title, the
log `service` field, the compose container names and the Postgres
`application_name`. It generates a real `JWT_SECRET` and then deletes itself.

| Endpoint | URL |
| --- | --- |
| API base | `http://localhost:3001/api/v1` |
| Swagger UI | `http://localhost:3001/api/doc` |
| OpenAPI JSON | `http://localhost:3001/api/doc-json` |
| Health probe | `http://localhost:3001/health` |

> The template ships **no auth feature**: `JwtAuthGuard` is global and every
> route is protected except `@Public()` ones, so your first feature is usually
> an `auth` module with a login endpoint. `example/src/services/auth/` is the
> reference implementation.

---

## Why the registries exist

Adding a feature used to mean editing five files (`ENTITIES`, the data module's
providers and exports, `presentation.module.ts`, and the Swagger tags in
`main.ts`). That is now **three registry files**:

| File | Holds |
| --- | --- |
| `src/data/feature.registry.ts` | `ENTITIES`, `REPOSITORY_PROVIDERS`, `REPOSITORY_EXPORTS` |
| `src/presentation/feature.registry.ts` | `FEATURE_MODULES`, `SWAGGER_TAGS` |
| `src/data/seed/seed.registry.ts` | `SEEDERS` |

Everything that consumes them is identical in every app, which is why
`template/` and `example/` can share `database.module.ts`,
`presentation.module.ts` and `main.ts` byte for byte — and why CI can prove it.

```bash
npm run generate:feature -- --name order --fields "code:string:unique,total:numeric(12,2)"
```

writes the entity, repository, DTO, service + interface, controller, module,
four request classes, the Swagger list model and a spec skeleton — then wires
both registries for you.

---

## Repository maintenance (this repo only, not the template)

```bash
npm run sync          # copy template/ core files into example/
npm run sync:check    # fail if example/ has drifted
npm run hooks:install # point git at .husky (secret scan on every commit)
```

`template/` is the single source of truth. **Never edit a shared file under
`example/`** — edit it in `template/`, run `npm run sync`, and commit both. The
`sync-guard` workflow fails the build otherwise.

What each folder owns:

| Bucket | Files | Rule |
| --- | --- | --- |
| core | 112 | Byte-identical. Synced from `template/`. |
| diverge | 3 registries | Each folder owns its own contents. |
| example-only | ~40 | The demo domain. Never in the template. |

The full contract lives in [`tools/core-manifest.json`](./tools/core-manifest.json).

---

## CI

Two pipelines, each owning half of the proof — do not read one and assume it is
the whole gate.

| Pipeline | Jobs | Owns |
| --- | --- | --- |
| CircleCI ([`.circleci/config.yml`](./.circleci/config.yml)) | `quality` × `template`/`example`, `e2e-template`, `license` | format, lint, typecheck, coverage, build, the DB-free template e2e suite, and the FOSSA license gate |
| GitHub Actions ([`.github/workflows/`](./.github/workflows)) | `ci.yml`, `e2e.yml`, `sync-guard.yml`, `secret-scan.yml` | the same quality matrix, the example e2e suite against Postgres 17, `template/` ⇄ `example/` byte-identity, and gitleaks |

The Node floor is **24**: `@nestjs/*` is ESM-only and Jest can only
`require(esm)` it from Node 24.9 onwards, so Node 22 cannot run the test suite.
`engines.node` in both folders says the same thing.

The FOSSA job needs a `FOSSA_API_KEY` in the CircleCI project settings; the
scan surface is pinned by [`.fossa.yml`](./.fossa.yml) because the lockfiles
live in `template/` and `example/`, not at the repository root.

---

## Documentation

| File | Contents |
| --- | --- |
| [`template/TEMPLATE.md`](./template/TEMPLATE.md) | What the template does and does not give you; the checklist before production |
| [`template/ARCHITECTURE.md`](./template/ARCHITECTURE.md) | Layers, dependency rules, request lifecycle, base classes |
| [`template/STYLE_GUIDE.md`](./template/STYLE_GUIDE.md) | Naming, DI, JSDoc, error handling, testing conventions |
| [`template/.clinerules/rule.md`](./template/.clinerules/rule.md) | Condensed rules for AI-assisted changes |
| [`example/README.md`](./example/README.md) | File-by-file map from demo code to the idea it demonstrates |

---

## Security

- `env/.env.*` is git-ignored; only `.env.example` is committed.
- `JWT_SECRET` must be ≥ 32 characters or the app refuses to boot.
- `.husky/pre-commit` blocks a commit that contains a credential.
- Logs redact `authorization`, `cookie`, `set-cookie`, `password`, `accessToken`.
- 5xx responses carry an opaque message; the stack only reaches the log.

## License

MIT — see [LICENSE](./LICENSE).