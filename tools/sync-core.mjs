#!/usr/bin/env node
/**
 * Copies every CORE-SYNC file from `template/` into `example/`.
 *
 * `template/` is the single source of truth. Run this after changing anything
 * shared — never edit the copy under `example/`, because `verify-sync.mjs`
 * fails CI the moment the two disagree.
 *
 * Files listed under `diverge` and `exampleOnly` in `tools/core-manifest.json`
 * are never touched.
 *
 *   node tools/sync-core.mjs            # copy
 *   node tools/sync-core.mjs --dry-run  # report only
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { EXAMPLE_DIR, TEMPLATE_DIR, coreFiles } from './core-paths.mjs';

const dryRun = process.argv.includes('--dry-run');

/**
 * Reads a file as text, tolerating binary content.
 * @param {string} path - absolute path
 * @returns {string} the content
 */
function read(path) {
	return readFileSync(path);
}

/**
 * Reports whether the destination already matches the source.
 * @param {string} source - absolute source path
 * @param {string} destination - absolute destination path
 * @returns {boolean} true when identical
 */
function identical(source, destination) {
	if (!existsSync(destination)) {
		return false;
	}

	return Buffer.compare(read(source), read(destination)) === 0;
}

const files = coreFiles();
const copied = [];
const unchanged = [];

for (const file of files) {
	const source = join(TEMPLATE_DIR, file);
	const destination = join(EXAMPLE_DIR, file);

	if (identical(source, destination)) {
		unchanged.push(file);
		continue;
	}

	copied.push(file);

	if (!dryRun) {
		mkdirSync(dirname(destination), { recursive: true });
		writeFileSync(destination, read(source));
	}
}

const verb = dryRun ? 'would copy' : 'copied';

process.stdout.write(`sync-core: ${copied.length} ${verb}, ${unchanged.length} already in sync\n`);

for (const file of copied) {
	process.stdout.write(`  → ${file}\n`);
}