# NestJS API Template

[![CI](https://github.com/vosonha89/nestjs-base-template/actions/workflows/ci.yml/badge.svg)](https://github.com/vosonha89/nestjs-base-template/actions/workflows/ci.yml)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fvosonha89%2Fnestjs-base-template.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fvosonha89%2Fnestjs-base-template?ref=badge_shield)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/vosonha89/nestjs-base-template/badge)](https://scorecard.dev/viewer/?uri=github.com/vosonha89/nestjs-base-template)

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

GitHub Actions is the only pipeline. Each workflow owns one concern, so a red
check tells you which guarantee broke.

| Workflow | Owns |
| --- | --- |
| [`ci.yml`](./.github/workflows/ci.yml) | format, lint, typecheck, coverage and build for both folders; the DB-free template e2e suite; the standalone-template and consumer-flow proofs |
| [`e2e.yml`](./.github/workflows/e2e.yml) | the example e2e suite against Postgres 17 — migrations, seed, row locking |
| [`sync-guard.yml`](./.github/workflows/sync-guard.yml) | `template/` ⇄ `example/` byte-identity |
| [`secret-scan.yml`](./.github/workflows/secret-scan.yml) | gitleaks over the full history |
| [`license.yml`](./.github/workflows/license.yml) | the FOSSA license gate |
| [`codeql.yml`](./.github/workflows/codeql.yml), [`security.yml`](./.github/workflows/security.yml), [`scorecard.yml`](./.github/workflows/scorecard.yml) | security scanning — see below |

The Node floor is **24**: `@nestjs/*` is ESM-only and Jest can only
`require(esm)` it from Node 24.9 onwards, so Node 22 cannot run the test suite.
`engines.node` in both folders says the same thing.

The FOSSA job needs a `FOSSA_API_KEY` repository secret (Settings → Secrets and
variables → Actions); the scan surface is pinned by [`.fossa.yml`](./.fossa.yml)
because the lockfiles live in `template/` and `example/`, not at the repository
root. It is skipped on pull requests from forks, which cannot read secrets.

### Security scanning

All of it is free on a public repository — no account, no token, no paid tier.

| Workflow | Tool | Catches |
| --- | --- | --- |
| [`codeql.yml`](./.github/workflows/codeql.yml) | CodeQL (`security-extended`) | injection, path traversal, XSS in the TypeScript source |
| [`security.yml`](./.github/workflows/security.yml) | OSV-Scanner | known vulnerabilities in both lockfiles; on a PR it blocks only the ones the PR introduces |
| | dependency-review | a PR that adds a dependency with a `high`/`critical` advisory |
| | Hadolint | `template/Dockerfile` warnings and errors (`example/` is a byte-identical copy) |
| [`scorecard.yml`](./.github/workflows/scorecard.yml) | OpenSSF Scorecard | posture gaps: unpinned actions, missing branch protection, token permissions |

The policy is **block regressions, report the rest**. A PR fails if it introduces
a vulnerability or a `high`/`critical` dependency; the scheduled full scan uploads
everything to Security > Code scanning without failing, because both lockfiles
currently carry 8 medium advisories in dev-only transitive dependencies (`glob`,
`minimatch`). Hadolint ignores info-level advisories — `USER node` is deliberate
and would otherwise trip DL3066.

Scorecard sits in its own workflow because publishing results imposes strict
rules on the producing workflow — no workflow-level write permissions and only
an approved set of actions in that job. Its badge populates after the first run
on `main`.

Dependabot ([`.github/dependabot.yml`](./.github/dependabot.yml)) opens the
upgrade PRs; dependency-review and OSV-Scanner are what stop a regression from
landing while those PRs are open.

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