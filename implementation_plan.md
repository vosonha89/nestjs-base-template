# Migration: Jest → Vitest

## Summary

| # | Goal | Expected outcome |
|---|------|------------------|
| 1 | Replace jest with vitest | 0 FOSSA outdated_dependency issues from jest chain |
| 2 | Maintain test coverage | Same or better coverage thresholds |
| 3 | Keep E2E intact | supertest + @nestjs/testing unchanged |

- [ ] All 58 test files migrated (template + example)
- [ ] Coverage thresholds met (branches 70, functions 55, lines 75, statements 75)
- [ ] CI green with vitest commands
- [ ] FOSSA quality check green (0 active issues)

Overview: Migrate test runner from jest to vitest to eliminate 20 transitive outdated_dependency issues from jest-30 chain (ansi-escapes, camelcase, execa, find-up, get-stream, human-signals, js-tokens, lru-cache, mimic-fn, onetime, parse-json, pkg-dir, p-limit, p-locate, string-length, string-width, supports-color, wrap-ansi). Vitest is ESM-native, uses Vite's resolver (no babel chain), and has compatible API (vi.fn, describe, it, expect).

## Key Changes

### A. Dependencies (template/ + example/)

| # | Item | Files | Depends on | Verification |
|---|------|-------|------------|--------------|
| 1 | Remove jest, ts-jest, @types/jest | package.json both apps | — | npm install clean |
| 2 | Add vitest, @vitest/coverage-v8 | package.json both apps | #1 | npm install, vitest --version |
| 3 | Update overrides (remove jest-related) | package.json both apps | #2 | lockfile clean |

- [ ] Dependencies updated, installed, lockfiles committed

### B. Config files

| # | Item | Files | Depends on | Verification |
|---|------|-------|------------|--------------|
| 4 | Create vitest.config.ts (resolve.alias for @config, @common, @data, @services, @presentation, @test) | template/, example/ | #2 | vitest run passes |
| 5 | Update tsconfig.json (remove jest types if present) | template/, example/ | #4 | typecheck passes |
| 6 | Delete test/jest-e2e.json | template/, example/ | #4 | no references remain |

- [ ] vitest.config.ts created with correct aliases
- [ ] tsconfig.json cleaned
- [ ] jest-e2e.json removed

### C. Test file migrations (58 files)

| # | Item | Files | Depends on | Verification |
|---|------|-------|------------|--------------|
| 7 | Replace `jest.fn()` → `vi.fn()` | all .spec.ts | #4 | vitest run passes |
| 8 | Replace `jest.Mock` → `vi.Mock` | all .spec.ts | #7 | typecheck passes |
| 9 | Replace `jest.Mocked<T>` → `vi.Mocked<T>` | all .spec.ts | #7 | typecheck passes |
| 10 | Add `import { vi } from 'vitest'` where jest.* used | all .spec.ts | #7 | vitest run passes |
| 11 | Add `import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'` | all .spec.ts | #7 | vitest run passes |
| 12 | Keep `.mockResolvedValue()`, `.mockImplementation()`, `.mockReturnValue()` unchanged | all .spec.ts | #7 | vitest run passes |
| 13 | Keep `Test.createTestingModule` and `supertest` unchanged (E2E) | e2e-spec.ts | #4 | e2e passes |

- [ ] All 58 files migrated
- [ ] Unit tests pass (vitest run)
- [ ] E2E tests pass (vitest run --config or separate command)

### D. Package scripts

| # | Item | Files | Depends on | Verification |
|---|------|-------|------------|--------------|
| 14 | Update scripts: test → vitest, test:cov → vitest --coverage, test:e2e → vitest --config ./test/vitest-e2e.config.ts | package.json both apps | #4 | npm run test passes |
| 15 | Remove NODE_OPTIONS=--experimental-vm-modules from scripts | package.json both apps | #14 | npm run test passes |

- [ ] Scripts updated, commands work

### E. CI workflows

| # | Item | Files | Depends on | Verification |
|---|------|-------|------------|--------------|
| 16 | Remove NODE_OPTIONS=--experimental-vm-modules from CI test steps | .github/workflows/ci.yml, e2e.yml | #14 | CI passes |
| 17 | Update test commands if needed | .github/workflows/ci.yml, e2e.yml | #14 | CI passes |

- [ ] CI workflows updated
- [ ] CI green on push

## Test Plan

| # | Item | Where | Pass criteria |
|---|------|-------|---------------|
| 1 | Unit tests (vitest run) | template + example local | all pass |
| 2 | Coverage (vitest --coverage) | template + example local | thresholds met |
| 3 | E2E tests | template (no DB) + example (Postgres 17) | all pass |
| 4 | Typecheck | template + example local | exit 0 |
| 5 | Lint | template + example local | exit 0 |
| 6 | Full CI | GitHub Actions | all jobs green |
| 7 | FOSSA quality check | GitHub status | 0 active issues |

- [ ] Local gates green
- [ ] CI green
- [ ] FOSSA green

## Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | vi.Mocked type incompatibility | Test compile, adjust if needed |
| 2 | Coverage thresholds differ (v8 vs istanbul) | Adjust thresholds if needed |
| 3 | ESM/CJS interop in test files | Vitest handles natively, but verify |
| 4 | Path aliases not resolving | Verify vitest.config.ts resolve.alias |
| 5 | Mock chaining API differences | Test thoroughly, vi.fn() API is compatible |

- [ ] Each batch committed independently
- [ ] Rollback: revert commits, restore jest

## Assumptions

| # | Assumption |
|---|------------|
| 1 | Vitest API compatible with jest for our usage patterns |
| 2 | @nestjs/testing works with vitest (no jest dependency) |
| 3 | supertest works with vitest (no jest dependency) |
| 4 | Vite resolver handles TypeScript paths correctly |

## Rejected Alternatives

| # | Alternative | Reason rejected |
|---|-------------|-----------------|
| 1 | Keep jest, ignore FOSSA issues | User chose real fix |
| 2 | Override jest transitive deps | ESM-only targets break babel chain |
| 3 | Migrate to mocha/chai | Larger rewrite, vitest API closer to jest |

## Implementation Order

1. Dependencies (remove jest, add vitest) → 2. Config (vitest.config.ts) → 3. Test file migrations (batch by pattern) → 4. Scripts update → 5. CI update → 6. Verify + push
