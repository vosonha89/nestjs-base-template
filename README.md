# NestJS API Template

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
| core | 106 | Byte-identical. Synced from `template/`. |
| diverge | 3 registries | Each folder owns its own contents. |
| example-only | ~40 | The demo domain. Never in the template. |

The full contract lives in [`tools/core-manifest.json`](./tools/core-manifest.json).

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

MIT