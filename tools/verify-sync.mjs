#!/usr/bin/env node
/**
 * Fails when any CORE-SYNC file differs between `template/` and `example/`.
 *
 * This is the guard that stops the two folders drifting apart: without it,
 * "example/ is just the template plus a demo" becomes untrue within a month.
 *
 *   node tools/verify-sync.mjs       # exit 1 on drift
 *   node tools/verify-sync.mjs --fix # copy the template version over first
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { EXAMPLE_DIR, TEMPLATE_DIR, coreFiles } from './core-paths.mjs';

const fix = process.argv.includes('--fix');

if (fix) {
	execFileSync(process.execPath, [join(import.meta.dirname, 'sync-core.mjs')], { stdio: 'inherit' });
}

const files = coreFiles();
const missing = [];
const drifted = [];

for (const file of files) {
	const source = join(TEMPLATE_DIR, file);
	const destination = join(EXAMPLE_DIR, file);

	if (!existsSync(destination)) {
		missing.push(file);
		continue;
	}

	try {
		execFileSync('diff', ['-q', source, destination], { stdio: 'pipe' });
	} catch {
		drifted.push(file);
	}
}

if (missing.length === 0 && drifted.length === 0) {
	process.stdout.write(`verify-sync: ${files.length} core files identical in template/ and example/\n`);
	process.exit(0);
}

process.stderr.write('\n  verify-sync failed — example/ has drifted from template/\n\n');

for (const file of missing) {
	process.stderr.write(`  ✗ missing in example/   ${file}\n`);
}

for (const file of drifted) {
	process.stderr.write(`  ✗ differs              ${file}\n`);
}

process.stderr.write(
	'\n  Fix by editing template/, then:\n' +
		'    node tools/sync-core.mjs\n' +
		'  or, to accept the template version as-is:\n' +
		'    node tools/verify-sync.mjs --fix\n\n'
);

process.exit(1);