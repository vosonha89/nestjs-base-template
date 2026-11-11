#!/usr/bin/env node
/**
 * Staged-file secret scanner.
 *
 * Zero dependency on purpose: a template must not require an install step
 * before it can protect itself. Wire it up once with
 *
 *   git config core.hooksPath .husky
 *
 * and every `git commit` runs it against the staged blob, not the working
 * tree, so an `env/.env.*` that is git-ignored can never sneak in via
 * `git add -f`.
 *
 * Exit codes: 0 clean, 1 findings, 2 internal error.
 */
import { execFileSync } from 'node:child_process';

/** Patterns that must never reach a commit. */
const RULES = [
	{ id: 'neon-db-password', re: /\bnpg_[A-Za-z0-9]{8,}/g },
	{ id: 'github-pat', re: /\bgh[pousr]_[A-Za-z0-9]{20,}/g },
	{ id: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/g },
	{ id: 'aws-secret-key', re: /\baws_secret_access_key\s*=\s*\S{20,}/gi },
	{ id: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g },
	{ id: 'private-key-block', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g },
	// A committed env file is a finding even when the value looks harmless,
	// because the next person edits it in place.
	{ id: 'committed-env-file', re: /^(?:\+\+\+ b\/)?.*(?:^|\/)\.env\.(?!example$)[A-Za-z0-9._-]+$/gm, pathOnly: true }
];

/** Files that may mention a pattern without being a leak. */
const ALLOWLIST = [
	'tools/check-secrets.mjs',
	'.clinerules/rule.md',
	'TEMPLATE.md',
	'README.md',
	'ARCHITECTURE.md'
];

/**
 * Lists files staged for commit, excluding deletions.
 * @returns {string[]} repository-relative paths
 */
function stagedFiles() {
	const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
		encoding: 'utf8'
	});

	return output
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

/**
 * Reads the staged content of a file.
 * @param {string} file - repository-relative path
 * @returns {string} blob content
 */
function stagedContent(file) {
	try {
		return execFileSync('git', ['show', `:${file}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
	} catch {
		// Binary or unreadable: nothing to scan textually.
		return '';
	}
}

/**
 * Scans one file against every rule.
 * @param {string} file - repository-relative path
 * @returns {Array<{rule: string, file: string, line: number}>} findings
 */
function scanFile(file) {
	if (ALLOWLIST.includes(file)) {
		return [];
	}

	const findings = [];
	const envRule = RULES.find((rule) => rule.id === 'committed-env-file');

	if (envRule !== undefined && envRule.re.test(file) && !/\.env\.example$/.test(file)) {
		findings.push({ rule: envRule.id, file, line: 0 });
	}

	const content = stagedContent(file);

	if (content === '') {
		return findings;
	}

	for (const rule of RULES) {
		if (rule.pathOnly === true) {
			continue;
		}

		// A fresh regex per file: a `g` flag keeps `lastIndex` between calls.
		rule.re.lastIndex = 0;
		let match = rule.re.exec(content);

		while (match !== null) {
			const line = content.slice(0, match.index).split('\n').length;
			findings.push({ rule: rule.id, file, line });
			match = rule.re.exec(content);
		}
	}

	return findings;
}

function main() {
	const files = stagedFiles();

	if (files.length === 0) {
		return 0;
	}

	const findings = files.flatMap(scanFile);

	if (findings.length === 0) {
		return 0;
	}

	process.stderr.write('\n  Secret scan failed — commit blocked\n\n');

	for (const finding of findings) {
		const where = finding.line > 0 ? `${finding.file}:${finding.line}` : finding.file;
		process.stderr.write(`  ✗ [${finding.rule}] ${where}\n`);
	}

	process.stderr.write(
		'\n  Rotate the credential, remove it from the file, and stage the fix.\n' +
			'  Never use `git commit --no-verify` to get past this check.\n\n'
	);

	return 1;
}

try {
	process.exit(main());
} catch (error) {
	process.stderr.write(`secret scan crashed: ${String(error)}\n`);
	process.exit(2);
}