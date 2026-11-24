# Security Policy

## Supported Versions

This repository is a template: `template/` is the source of truth and
`example/` is its runnable demo. Security fixes land on `main` and reach
consumers through their next copy of the template.

The runtime baseline follows the Node.js LTS lines:

| Node.js line | Status | Security support until |
| --- | --- | --- |
| 26 (default) | Active LTS | 2029-04-30 |
| 24 | Maintenance LTS | 2028-04-30 |
| 22 | Maintenance LTS | 2027-04-30 |

`engines.node` enforces the patched floor of each line, so a vulnerable
patch release cannot be used without an `EBADENGINE` warning.

## Reporting a Vulnerability

Please do **not** open a public issue for a vulnerability.

Use GitHub's private vulnerability reporting on this repository:
**Security → Report a vulnerability**.

We aim to acknowledge reports within 7 days and to coordinate a fix and
disclosure timeline with the reporter.

## Scope

- In scope: the `template/` and `example/` source, both Dockerfiles, and the
  GitHub Actions workflows in this repository.
- Out of scope: vulnerabilities in Node.js itself — report those upstream via
  the [Node.js security policy](https://github.com/nodejs/node/blob/main/SECURITY.md) —
  and in third-party dependencies, which belong to their respective
  maintainers. Dependabot, OSV-Scanner and the FOSSA scan in this repository
  track those fixes (the FOSSA workflow runs once `FOSSA_API_KEY` is set).