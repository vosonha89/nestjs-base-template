# Senior Backend TypeScript Developer — playbook

The engineering standard this template encodes. Use it as the checklist when
adding a feature, reviewing a pull request, or judging whether a shortcut is
acceptable.

## 1. Think in layers, not in files

Ask "which layer owns this decision?" before writing code.

| Question | Owner |
| --- | --- |
| which HTTP verb, which status code, which header? | presentation |
| is this payload well formed? | presentation (`class-validator`) |
| may this user do it? | presentation (`RolesGuard`) + service (ownership rules) |
| what is a valid state transition? | service |
| what does "out of stock" mean? | service |
| how is this persisted, locked, indexed? | data |
| how is this configured? | config |

A rule implemented in the wrong layer works until the second caller appears.

## 2. Make the unsafe thing impossible

Prefer designs where the mistake cannot be expressed over designs that rely on
review:

- a response DTO with `@Expose()` and `excludeExtraneousValues` makes a leak
  require an explicit act;
- a `select: false` column makes an accidental hash read impossible;
- a whitelist on `fieldName`/`sortField` makes column probing a `4007`;
- `forbidNonWhitelisted` makes mass assignment a `400`;
- a global guard with `@Public()` opt-out makes an unprotected route visible in
  the diff.

## 3. Validate at the boundary, then trust the type

- validate once — at the edge (env at boot, payload at the controller);
- after that, the type says what is true; do not re-check;
- a validation rule belongs in a decorator, not in an `if` in the middle of a
  service.

## 4. Errors are a contract

- one envelope, one catalogue, one filter;
- numeric codes are stable, messages are not;
- never leak an internal message on `500`;
- "not found" is `404`, not `200` with an empty body; "created" is `201`;
- a conflict is decided by the database (unique index → `23505` → `409`), never
  by a racy pre-flight `SELECT`.

## 5. Transactions and concurrency

- if a rule reads a value and then writes based on it, lock the row;
- put the lock and the transaction in the repository method, so the guarantee
  cannot be forgotten by a future caller;
- assume two requests arrive at the same time — always.

## 6. Observability

- one structured access log line per request: method, url, outcome, duration,
  correlation id;
- correlation id in, correlation id out (`x-request-id`), validated before reuse;
- secrets are redacted at the sink **and** never passed to it;
- log decisions, not payloads.

## 7. Testing that earns its keep

- test the contract: status, error code, absence of a sensitive field, the
  generated query;
- test the failure path first — happy paths rarely regress;
- one meaningful assertion beats five trivial ones;
- coverage is a floor, not a goal; it must never be lowered to pass.

## 8. Dependencies and versions

- pin versions that actually intersect: check the peer ranges of `ts-jest`,
  `typescript-eslint` and `@nestjs/swagger` before bumping TypeScript;
- prefer a pure-JS implementation when a native one buys nothing
  (`bcryptjs` over `bcrypt`);
- prefer a major upgrade behind an interface you already own (TypeORM 0.3 now,
  1.x later, one file to change);
- verify a new major's runtime model before adopting it — NestJS 12 being
  ESM-only changes how Jest and `require` behave.

## 9. Review checklist

- [ ] layer of every new import is legal (ESLint proves it)
- [ ] required fields carry `@IsNotEmpty()`; DTOs carry `@Expose()`
- [ ] no secret in a response, a log line, a fixture or a commit
- [ ] `400x` code chosen from the catalogue, not invented
- [ ] read-then-write path holds a lock
- [ ] migration reviewed: types, `timestamptz`, `numeric`, indexes
- [ ] tests cover the failure path and DI wiring
- [ ] `format:check`, `lint:check`, `typecheck`, `build`, `test:cov` all pass

## 10. Smells

| Smell | Usually means |
| --- | --- |
| `as any` | the abstraction is missing a type parameter |
| `Controller` importing an entity | mapping was skipped |
| service importing `@nestjs/common` HTTP types | HTTP logic leaked down |
| `try/catch` that re-throws the same error | the filter already handles it |
| a boolean flag parameter | two methods are hiding in one |
| `if (env === 'production')` in business code | config belongs in `src/config` |
| a test that mocks the ORM internals | the port is too leaky |