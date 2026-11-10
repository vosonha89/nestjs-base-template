# Rules for AI-assisted changes

Condensed, non-negotiable. The CI gates (`lint:check`, `typecheck`, `test:cov`)
already enforce most of it — these are the decisions a machine cannot infer.

## Architecture

1. Layers and import direction are fixed:
   `presentation → services → data → common → config`.
   `presentation` must never import `@data/*`. ESLint fails if it does.
2. A controller holds **no** logic: it validates, calls one service, wraps the
   result. A service holds **no** HTTP concept: no `Request`, no `Response`, no
   status code.
3. A repository holds **no** business rule, except the row lock and the
   transaction that belongs to that lock.
4. `src/config` is the only place allowed to read `process.env`.
5. Adding a feature touches only its own folders plus the module registry. If it
   needs `common/`, fix the abstraction instead of special-casing.

## Non-negotiable style

- tabs, single quotes, 120 columns, no trailing comma, explicit `;`
- `I` prefix on interfaces, `<Name>Symbol` for DI tokens, singular folder names
- explicit access modifier **and** explicit return type on every member
- JSDoc on every exported symbol, with `@param` / `@returns` / `@throws`
- `readonly` on injected collaborators
- no `any`, no `@ts-ignore`, no `console.*`
- one public export per file, no `index.ts` barrels

## Validation & data safety

- request classes extend `BaseCreateRequest` / `BaseUpdateRequest` /
  `BaseSearchRequest`; `@IsNotEmpty()` on every required field (→ `4001`)
- DTOs extend `BaseType<TId>` and every returned field needs `@Expose()`
- a field accepted on input but never returned simply has **no** `@Expose()`
- passwords are hashed with `HashServiceSymbol`, never stored or compared raw;
  bcrypt input is capped at 72 characters
- unique constraints live in the database, not in a pre-flight `SELECT`
- `synchronize` stays `false`; every schema change is a migration

## Errors

- throw `AppError` carrying a `GlobalError` code; never `throw new Error(...)` in
  business code
- new codes are appended to `GlobalError` (`4001`–`4008` are taken)
- a `500` returns an opaque message; the stack only reaches the log
- filter and sort columns must be in `searchableFields` / `sortableFields`

## Rate limiting

- `ThrottlerGuard` is global and registered in `CommonModule` — a feature module
  must never declare it again
- `@SkipThrottle()` only for probes/internal pollers; `/health` is the only
  exception today
- `THROTTLE_TTL` is **seconds**; the module converts with `seconds()` because
  `@nestjs/throttler` v6 wants **milliseconds**. Never pass the env value
  straight into `ttl` — a 1000× mistake silently removes the protection
- if a route documents `429`, a test must prove the `429`

## Dependencies and versions

- **Do not upgrade TypeScript to 7.x.** Verified: TS 7.0 ships only the `tsc`
  executable, no programmatic compiler API, so `nest build` and
  `typescript-eslint` both fail hard. Wait for TypeScript **7.1**.
- Do not bump `eslint` back below 10 (v9 is EOL) and do not bump `@types/node`
  above the running Node major.
- Before any major upgrade, read the upstream release notes **and** run the four
  gates plus the smoke matrix; peer ranges alone do not tell you whether the
  package exposes the API your tools call.

## Tests

- `*.spec.ts` beside the file; `should …` in the test name
- prefer `Test.createTestingModule` so DI wiring is exercised
- mock the port (interface + Symbol), not the ORM
- assert the contract (error code, absence of `password`, generated `where`),
  not the implementation
- never lower `coverageThreshold` to make a suite pass — add the test

## Before you say "done"

```bash
npm run format:check && npm run lint:check && npm run typecheck && npm run build && npm run test:cov
```

All five must pass. If the change touches the API surface or a migration, also
run `npm run test:e2e` against a reachable database.

## Never

- commit a file under `env/.env.*` (only `.env.example`)
- put a real credential in a test, a fixture or a log assertion
- use `Scope.REQUEST`
- widen a coverage threshold
- leave a TODO without an issue reference