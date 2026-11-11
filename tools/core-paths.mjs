#!/usr/bin/env node
/**
 * Shared helpers for the template ⇄ example synchronisation scripts.
 *
 * Zero dependencies: the repository must be usable (and its guard runnable)
 * before `npm install`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Folder that owns the canonical implementation of every shared file. */
export const TEMPLATE_DIR = join(ROOT, 'template');

/** Folder that consumes the shared files and adds the demo domain. */
export const EXAMPLE_DIR = join(ROOT, 'example');

/**
 * Loads the synchronisation manifest.
 * @returns {object} the parsed manifest
 */
export function loadManifest() {
	return JSON.parse(readFileSync(join(ROOT, 'tools', 'core-manifest.json'), 'utf8'));
}

/**
 * Normalises a path to POSIX separators so comparisons work on every platform.
 * @param {string} value - any path
 * @returns {string} the same path with forward slashes
 */
export function toPosix(value) {
	return value.split(sep).join('/');
}

/**
 * Lists every file below a directory, recursively.
 * @param {string} dir - absolute directory
 * @returns {string[]} absolute file paths
 */
function walkAll(dir) {
	const out = [];

	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const absolute = join(dir, entry.name);

		if (entry.isDirectory()) {
			out.push(...walkAll(absolute));
		} else if (entry.isFile()) {
			out.push(absolute);
		}
	}

	return out;
}

/**
 * Resolves the manifest into the concrete list of files that must be identical
 * in both folders.
 * @returns {string[]} repository-relative POSIX paths, sorted
 */
export function coreFiles() {
	const manifest = loadManifest();
	const files = new Set(manifest.files);
	const extensions = new Map(manifest.walk.map((entry) => [entry.dir, entry.extensions]));

	for (const entry of manifest.walk) {
		const absoluteDir = join(TEMPLATE_DIR, entry.dir);

		let stats;
		try {
			stats = statSync(absoluteDir);
		} catch {
			continue;
		}

		if (!stats.isDirectory()) {
			continue;
		}

		const allowed = extensions.get(entry.dir);

		for (const absolute of walkAll(absoluteDir)) {
			if (allowed !== undefined && !allowed.some((extension) => absolute.endsWith(extension))) {
				continue;
			}

			files.add(toPosix(relative(TEMPLATE_DIR, absolute)));
		}
	}

	const diverge = new Set(manifest.diverge);

	return [...files].filter((file) => !diverge.has(file)).sort();
}