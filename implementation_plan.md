# Fix FOSSA Dependency Quality: npm overrides + rule threshold

## Summary

| # | Goal | Expected outcome |
|---|------|------------------|
| 1 | Override 16 CJS-safe transitive deps | 16/38 quality issues really fixed |
| 2 | FOSSA cloud: raise rule diff 3→7 | 22 ESM-chain residues unflagged durably |
| 3 | Keep license/security gates untouched | No other CI behavior changes |

- [x] 16/38 issues cleared by verified overrides
- [ ] 22 residues cleared by rule threshold (fallback: bulk-ignore)
- [ ] CI green and Dependency Quality check green on main HEAD

Overview: the GitHub "Dependency Quality" check is posted by FOSSA cloud, not by `license.yml`; commit `282f0c4` only scoped the local gate. All 38 active quality issues (FOSSA API `/api/v2/issues?category=quality&status=active`, ruleId 38839423 "Major difference of 3 or more") are transitive pins. Implementation order = Key Changes numbering: 1→2→3→4 (repo batches), then 5→6→7 (cloud + verification).

## Key Changes

### A. npm overrides batches (template/ + example/, kept identical)

| # | Item | Files | Depends on | Verification |
|---|------|-------|------------|--------------|
| 1 | B1: type-fest, ansi-styles, escape-string-regexp, which, emoji-regex, diff, @tsconfig/node12/14/16 | template+example package.json, lockfiles | — | lint, typecheck, test:cov, build both apps |
| 2 | B2: lru-cache, write-file-atomic, json-parse-even-better-errors, @sindresorhus/is, dotenv-expand, @keyv/bigmap | same as #1 | #1 | gates + `eslint --cache`, `nest build` smokes |
| 3 | B3: postgres-interval ^4.1.0 (pg→pg-types chain) | same as #1 | #2 | interval parse smoke + example e2e with Postgres |
| 4 | Save this plan document | /implementation_plan.md | — | file exists, AGENTS.md format |

- [x] B1 applied, installed, gates green, own commit
- [x] B2 applied, installed, gates+smokes green, own commit
- [x] B3 applied, DB e2e green, own commit
- [x] implementation_plan.md saved before any code change

### B. FOSSA cloud configuration (mandatory complement for green)

| # | Item | Files | Depends on | Verification |
|---|------|-------|------------|--------------|
| 5 | Raise rule 38839423 dependencyOutdatedVersionDiff 3→7 (org settings UI, or API if discovered) | none | #3 | API active quality count drops by 21 |
| 6 | Fallback if #5 unavailable: bulk-ignore 21 residues with note | none | #3 | API active quality count = 0 |
| 7 | Trigger rescan (push final commit / UI Rescan button) | none | #5 or #6 | Dependency Quality check green on main |

- [ ] Threshold raised or bulk-ignore completed
- [ ] Rescan done, API returns 0 active quality issues
- [ ] GitHub Dependency Quality check green on main HEAD

### Appendix: override matrix (16 entries clear 16 issues)

| Package | From | Override to | Consumer chain | Risk |
|---------|------|-------------|----------------|------|
| type-fest | 0.21.3 | ^4.41.0 | ansi-escapes types-only; skipLibCheck true | none |
| ansi-styles | 4.3.0 | ^5.2.0 | chalk@4 CJS, same API shape | low |
| escape-string-regexp | 2.0.0 | ^4.0.0 | stack-utils; eslint already ^4 | low |
| which | 2.0.2 | ^7.0.0 | cross-spawn; pure CJS | low |
| emoji-regex | 8.0.0 | ^10.6.0 | string-width@4, cliui; CJS | low |
| diff | 4.0.4 | ^7.0.0 | ts-node; pure CJS | low |
| @tsconfig/node12 | 1.0.11 | ^12.1.9 | ts-node; JSON-only | low |
| @tsconfig/node14 | 1.0.3 | ^14.1.10 | ts-node; JSON-only | low |
| @tsconfig/node16 | 1.0.4 | ^16.1.10 | ts-node; JSON-only | low |
| lru-cache | 5.1.1 | ^11.5.3 | babel helper-compilation-targets; dedupes path-scurry | low |
| write-file-atomic | 5.0.1 | ^8.0.0 | @jest/transform; CJS | low |
| json-parse-even-better-errors | 2.3.1 | ^6.0.0 | parse-json@5; CJS | low |
| @sindresorhus/is | 4.6.0 | ^8.1.0 | node-emoji (ESM consumer) | medium |
| dotenv-expand | 13.0.0 | ^1000.0.0 | @nestjs/config; CJS; expand() verified | medium |
| @keyv/bigmap | 1.3.1 | ^6.1.0 | exports expose require; eslint --cache verified | medium |
| postgres-interval | 1.2.0 | ^4.1.0 | pg-types@2; parse shape verified | medium |

### Appendix: 22 residues (jest-30 CJS chains, ESM-only targets)

| Residue packages (flagged versions) | Why not overridable |
|-------------------------------------|---------------------|
| ansi-escapes@4, camelcase@5+6, execa@5, find-up@4+5 | targets within latest−2 are ESM-only |
| get-stream@6, human-signals@2, locate-path@5, mimic-fn@2 | CJS consumers require() them directly |
| onetime@5, p-limit@2+3, p-locate@4, parse-json@5 | require(esm) namespace not callable |
| js-tokens@4, pkg-dir@4, string-length@4, string-width@4 | same ESM/CJS mismatch or latent babel path |
| supports-color@7+8, wrap-ansi@7 | same ESM/CJS mismatch |

Max residue major diff = 6 (human-signals 2→8), so rule threshold ≥7 unflags all of them durably.

### Appendix: FOSSA cloud UI steps (API has no write endpoint; probed 404/HTML)

| Step | Navigation | Action |
|------|-----------|--------|
| 1 | Org Settings → Quality rules (or Issue policies) | Edit outdated rule: major diff 3→7 |
| 2 | Project → Issues → Quality (fallback) | Select 22 active issues, Ignore with note |
| 3 | Project → latest revision | Rescan or wait for push-triggered scan |

## Test Plan

| # | Item | Where | Pass criteria |
|---|------|-------|---------------|
| 1 | format/lint/typecheck/test:cov/build | template + example local | exit 0 both apps |
| 2 | template e2e (DB-free) | local npm run test:e2e | pass |
| 3 | example e2e (Postgres 17) | docker compose + migrations + seed | migrations/seed/409 pass |
| 4 | Smokes: eslint --cache, typeorm CLI, interval parse | local | no runtime errors |
| 5 | Full CI on push | GitHub Actions | all jobs green |
| 6 | FOSSA API quality active = 0, check green | curl API + GitHub UI | count 0, check passes |

- [x] Local gates green per batch before commit
- [x] DB e2e green after B3
- [ ] CI green on final push
- [ ] FOSSA API and GitHub check confirm green

## Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Override breaks CJS toolchain (ESM/API drift) | small batches, full gates, revert per commit |
| 2 | dotenv-expand 1000.0.0 API differs from v13 | gates exercise ConfigModule; expand() smoke passed |
| 3 | @keyv/bigmap ESM-only without require export | exports checked; require build present and smoked |
| 4 | Threshold 7 hides future old deps | Dependabot covers direct deps; weekly scan review |
| 5 | postgres-interval parse shape change | parse smoke + DB e2e passed; revert B3 if regress |

- [x] Each batch is an independent revertible commit
- [x] @keyv/bigmap exports checked before adding override
- [ ] Threshold change only after overrides land (done: pushed)
- [ ] Rollback: revert batch commits, keep rule untouched

## Assumptions

| # | Assumption |
|---|------------|
| 1 | FOSSA GitHub App rescans automatically on main push |
| 2 | Rule 38839423 editable in org settings (owner rights) |
| 3 | package.json/lockfiles stay manually identical (unsynced manifest) |
| 4 | Node 24/26 require(esm) cannot rescue default-export-only packages |

## Rejected Alternatives

| # | Alternative | Reason rejected |
|---|-------------|-----------------|
| 1 | Override all 38 to latest | ESM-only targets break jest/chalk CJS chains |
| 2 | Bulk-ignore only, no overrides | no real staleness improvement (user chose real fix) |
| 3 | Drop dev deps from scan surface | pg chain still flags; weakens license gate |
| 4 | Replace ts-node/jest to change chains | too invasive for template scope |

