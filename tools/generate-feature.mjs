#!/usr/bin/env node
/**
 * Scaffolds a complete feature and wires it into both registries.
 *
 * Replaces the thirteen-step manual checklist in ARCHITECTURE.md §8 with one
 * command, and — more importantly — emits code that already passes
 * `format:check`, `lint:check` and `typecheck`.
 *
 *   node tools/generate-feature.mjs --name order --fields "code:string:unique,total:numeric(12,2)"
 *
 * Field grammar: `property:type[:modifier[,modifier]]`
 *   types     string | text | integer | numeric(p,s) | boolean | timestamptz
 *   modifiers unique | optional
 *
 * Where it writes is resolved in this order: `--target <dir>`, then the current
 * directory if it contains `src/` (a real application), then `./template`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import * as templates from './feature-templates.mjs';

/** Types accepted in a field specification. */
const TYPES = new Map([
	['string', { tsType: 'string', maxLength: 255, kind: 'string' }],
	['text', { tsType: 'string', maxLength: 4000, kind: 'string' }],
	['integer', { tsType: 'number', kind: 'int' }],
	['boolean', { tsType: 'boolean', kind: 'bool' }],
	['timestamptz', { tsType: 'Date', kind: 'date' }]
]);

/**
 * Prints the usage text.
 */
function usage() {
	process.stdout.write(`Usage: node tools/generate-feature.mjs --name <name> --fields "<spec>" [options]

  --name <name>       Feature name in kebab-case, e.g. order or sales-invoice (required)
  --fields <spec>     Comma separated fields, e.g. "code:string:unique,total:numeric(12,2)"
  --target <dir>      Project root. Default: cwd if it has src/, else ./template
  --dry-run           Print the file list, write nothing
  --help              Show this help

Field grammar: property:type[:modifier[+modifier]]
  types      string | text | integer | numeric(p,s) | boolean | timestamptz
  modifiers  unique | optional

Every feature gets: entity, repository, DTO, service + interface, controller,
module, create/update/search/delete requests, Swagger list model, a service
spec skeleton, and registration in both feature registries.
`);
}

/**
 * Parses `--flag value` pairs.
 * @param {string[]} argv - process arguments
 * @returns {Record<string, string | boolean>} parsed options
 */
function parseArgs(argv) {
	const options = {};

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];

		switch (token) {
			case '--name':
			case '--fields':
			case '--target':
				options[token.slice(2)] = argv[index + 1];
				index += 1;
				break;
			case '--dry-run':
				options.dryRun = true;
				break;
			case '--help':
			case '-h':
				options.help = true;
				break;
			default:
				throw new Error(`Unknown option: ${token}`);
		}
	}

	return options;
}

/**
 * Converts a kebab-case name into PascalCase.
 * @param {string} value - kebab-case name
 * @returns {string} PascalCase name
 */
function pascalCase(value) {
	return value
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

/**
 * Converts a kebab-case name into camelCase.
 * @param {string} value - kebab-case name
 * @returns {string} camelCase name
 */
function camelCase(value) {
	const pascal = pascalCase(value);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Naive English plural, good enough for table names and doc strings.
 * @param {string} value - singular label
 * @returns {string} plural label
 */
function pluralize(value) {
	if (value.endsWith('s')) {
		return value;
	}

	if (value.endsWith('y')) {
		return `${value.slice(0, -1)}ies`;
	}

	return `${value}s`;
}

/**
 * Splits a string on a separator that appears outside parentheses.
 *
 * Needed because `numeric(12,2)` contains the field separator itself.
 * @param {string} value - string to split
 * @param {string} separator - single-character separator
 * @returns {string[]} the parts
 */
function splitTopLevel(value, separator) {
	const parts = [];
	let depth = 0;
	let current = '';

	for (const character of value) {
		if (character === '(') {
			depth += 1;
		} else if (character === ')') {
			depth -= 1;
		}

		if (character === separator && depth === 0) {
			parts.push(current);
			current = '';
			continue;
		}

		current += character;
	}

	parts.push(current);

	return parts;
}

/**
 * Parses the `--fields` specification into normalised field descriptors.
 * @param {string} specification - raw field list
 * @returns {object[]} field descriptors
 */
function parseFields(specification) {
	if (specification === undefined || specification.trim() === '') {
		throw new Error('--fields is required (at least one field)');
	}

	return splitTopLevel(specification, ',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0)
		.map((entry) => {
			const [property, rawType, rawModifiers] = entry.split(':');
			const modifiers = new Set((rawModifiers ?? '').split('+').filter((item) => item.length > 0));

			if (!/^[a-z][A-Za-z0-9]*$/.test(property)) {
				throw new Error(`Invalid property "${property}": use camelCase starting with a letter`);
			}

			const numeric = /^numeric\((\d+),(\d+)\)$/.exec(rawType ?? '');
			const type =
				numeric !== null
					? { tsType: 'number', kind: 'numeric', precision: Number(numeric[1]), scale: Number(numeric[2]) }
					: TYPES.get(rawType ?? '');

			if (type === undefined) {
				throw new Error(`Invalid type "${rawType}" for ${property}. See --help for the accepted types.`);
			}

			return { property, ...type, unique: modifiers.has('unique'), optional: modifiers.has('optional') };
		});
}

/**
 * Builds the `@Column` / `@Index` decorator stack for the entity.
 * @param {string} table - table name
 * @param {object} field - field descriptor
 * @returns {string} the decorator block
 */
function entityColumn(table, field) {
	const lines = [`\t/** ${field.property} column. */`];

	if (field.unique) {
		lines.push(`\t@Index('idx_${table}_${field.property.toLowerCase()}', { unique: true })`);
	}

	const nullable = field.optional ? ', nullable: true' : '';

	switch (field.kind) {
		case 'string':
			lines.push(`\t@Column({ type: 'text'${nullable} })`);
			break;
		case 'int':
			lines.push(`\t@Column({ type: 'integer', default: 0${nullable} })`);
			break;
		case 'bool':
			lines.push(`\t@Column({ type: 'boolean', default: false${nullable} })`);
			break;
		case 'date':
			lines.push(`\t@Column({ type: 'timestamptz', nullable: true })`);
			break;
		case 'numeric':
			lines.push(
				`\t@Column({ type: 'numeric', precision: ${field.precision}, scale: ${field.scale}, default: 0, transformer: numericTransformer${nullable} })`
			);
			break;
		default:
			throw new Error(`Unsupported kind ${field.kind}`);
	}

	lines.push(`\tpublic ${field.property}${field.optional ? '?' : '!'}: ${field.tsType};`);

	return lines.join('\n');
}

/**
 * Builds the `@Expose()` / `@ApiProperty()` block for the DTO.
 * @param {object} field - field descriptor
 * @returns {string} the decorator block
 */
function dtoProperty(field) {
	const example = {
		string: "'example'",
		int: '0',
		bool: 'true',
		date: "'2026-01-01T00:00:00.000Z'",
		numeric: '0'
	}[field.kind];
	const required = field.optional ? ', required: false' : '';

	return [
		`\t/** ${field.property}. */`,
		'\t@Expose()',
		`\t@ApiProperty({ example: ${example}${required} })`,
		`\tpublic ${field.property}${field.optional ? '?' : '!'}: ${field.tsType};`
	].join('\n');
}

/**
 * Builds the validator decorator stack for one field, plus the class-validator
 * names it needs. Collecting names here is what keeps the generated imports
 * free of unused entries, which `lint:check` would reject.
 * @param {object} field - field descriptor
 * @param {'create'|'update'} mode - which request is being rendered
 * @returns {{lines: string[], imports: Set<string>}} decorator lines and imports
 */
function validatorsFor(field, mode) {
	const imports = new Set();
	const lines = [];
	const optional = mode === 'update' || field.optional;

	if (optional) {
		imports.add('IsOptional');
		lines.push('\t@IsOptional()');
	}

	switch (field.kind) {
		case 'string':
			if (!optional) {
				imports.add('IsNotEmpty');
				lines.push(`\t@IsNotEmpty({ message: '${field.property} is required' })`);
			}
			imports.add('IsString');
			imports.add('MaxLength');
			lines.push('\t@IsString()');
			if (!optional) {
				imports.add('MinLength');
				lines.push('\t@MinLength(1)');
			}
			lines.push(`\t@MaxLength(${field.maxLength})`);
			break;
		case 'int':
			if (!optional) {
				imports.add('IsNotEmpty');
				lines.push(`\t@IsNotEmpty({ message: '${field.property} is required' })`);
			}
			imports.add('Type');
			imports.add('IsInt');
			imports.add('Min');
			lines.push('\t@Type(() => Number)');
			lines.push('\t@IsInt()');
			lines.push('\t@Min(0)');
			break;
		case 'numeric':
			if (!optional) {
				imports.add('IsNotEmpty');
				lines.push(`\t@IsNotEmpty({ message: '${field.property} is required' })`);
			}
			imports.add('Type');
			imports.add('IsNumber');
			imports.add('Min');
			lines.push('\t@Type(() => Number)');
			lines.push(`\t@IsNumber({ maxDecimalPlaces: ${field.scale} })`);
			lines.push('\t@Min(0)');
			break;
		case 'bool':
			imports.add('IsBoolean');
			lines.push('\t@IsBoolean()');
			break;
		case 'date':
			imports.add('IsDateString');
			lines.push('\t@IsDateString()');
			break;
		default:
			throw new Error(`Unsupported kind ${field.kind}`);
	}

	return { lines, imports };
}

/**
 * Renders the import block a request file needs.
 * @param {Set<string>} names - class-validator names
 * @param {boolean} needsType - whether `Type` from class-transformer is used
 * @returns {string} the import lines, each terminated with a newline
 */
function importBlock(names, needsType) {
	const classTransformer = needsType ? "import { Type } from 'class-transformer';\n" : '';
	const validators = [...names].filter((name) => name !== 'Type').sort();

	return `${classTransformer}import { ${validators.join(', ')} } from 'class-validator';\n`;
}

/**
 * Renders one request property, including its Swagger documentation.
 * @param {object} field - field descriptor
 * @param {'create'|'update'} mode - which request is being rendered
 * @returns {string} the property block
 */
function requestProperty(field, mode) {
	const { lines, imports } = validatorsFor(field, mode);
	const example = {
		string: "'example'",
		int: '0',
		bool: 'true',
		date: "'2026-01-01T00:00:00.000Z'",
		numeric: '0'
	}[field.kind];
	const optional = mode === 'update' || field.optional;
	const apiOptions = optional
		? `{ description: '${field.property}', required: false }`
		: `{ description: '${field.property}', example: ${example} }`;

	return [
		`\t/** ${field.property}. */`,
		`\t@ApiProperty(${apiOptions})`,
		...lines,
		`\tpublic ${field.property}${optional ? '?' : '!'}: ${field.tsType};`,
		`\u0000${[...imports].join(',')}`
	].join('\n');
}

/**
 * Renders a whole request class body and its import block.
 * @param {object[]} fields - field descriptors
 * @param {'create'|'update'} mode - which request is being rendered
 * @returns {{body: string, imports: string}} rendered parts
 */
function renderRequestParts(fields, mode) {
	const used = new Set();
	const blocks = fields.map((field) => {
		const rendered = requestProperty(field, mode);
		const [body, importList] = rendered.split('\u0000');

		for (const name of (importList ?? '').split(',').filter((item) => item.length > 0)) {
			used.add(name);
		}

		return body.trimEnd();
	});

	return { body: blocks.join('\n\n'), imports: importBlock(used, used.has('Type')) };
}

/**
 * Removes the internal marker used to carry import names out of a rendered block.
 * @param {string} rendered - block produced by {@link requestProperty}
 * @returns {string} the block without the marker line
 */
function stripMarker(rendered) {
	return rendered.split('\u0000')[0].trimEnd();
}

/**
 * Resolves the project root the generator writes into.
 * @param {Record<string, string | boolean>} options - parsed options
 * @returns {string} absolute project root
 */
function resolveRoot(options) {
	if (typeof options.target === 'string') {
		const explicit = resolve(options.target);

		if (!existsSync(join(explicit, 'src'))) {
			throw new Error(`--target ${options.target} has no src/ directory`);
		}

		return explicit;
	}

	const cwd = process.cwd();

	if (existsSync(join(cwd, 'src'))) {
		return cwd;
	}

	if (existsSync(join(cwd, 'template', 'src'))) {
		return join(cwd, 'template');
	}

	throw new Error('Cannot find the project root. Run from an app directory, or pass --target.');
}

/**
 * Appends a value to an exported array literal, keeping the file valid.
 *
 * Handles both shapes the templates use: `= [];` and a multi-line literal.
 * @param {string} source - file content
 * @param {string} constName - exported constant holding the array
 * @param {string} item - source text of the new element
 * @returns {string} the updated content
 */
function insertIntoArray(source, constName, item) {
	const start = source.indexOf(`export const ${constName}`);

	if (start === -1) {
		throw new Error(`registry is missing the ${constName} declaration`);
	}

	// The type annotation may itself contain `[]` (e.g. `RegisteredEntity[]`),
	// so the array literal is the first `[` *after* the assignment.
	const equals = source.indexOf('=', start);

	if (equals === -1) {
		throw new Error(`registry declaration for ${constName} has no assignment`);
	}

	const open = source.indexOf('[', equals);

	if (open === -1) {
		throw new Error(`registry is missing the ${constName} array`);
	}

	let depth = 0;
	let close = -1;

	for (let index = open; index < source.length; index += 1) {
		if (source[index] === '[') {
			depth += 1;
		} else if (source[index] === ']') {
			depth -= 1;

			if (depth === 0) {
				close = index;
				break;
			}
		}
	}

	if (close === -1) {
		throw new Error(`could not find the end of the ${constName} array`);
	}

	const inner = source.slice(open + 1, close);

	if (inner.trim() === '') {
		return `${source.slice(0, open + 1)}\n\t${item}\n${source.slice(close)}`;
	}

	const trimmed = inner.replace(/\s+$/, '');
	const body = trimmed.endsWith(',') ? trimmed : `${trimmed},`;

	return `${source.slice(0, open + 1)}${body}\n\t${item}\n${source.slice(close)}`;
}

/**
 * Adds an import statement after the existing import block, unless it is there.
 * @param {string} source - file content
 * @param {string} line - import statement to add
 * @returns {string} the updated content
 */
function addImport(source, line) {
	if (source.includes(line)) {
		return source;
	}

	const lines = source.split('\n');
	let lastImport = -1;

	for (let index = 0; index < lines.length; index += 1) {
		if (/^import\s/.test(lines[index]) || /^}\s*from\s/.test(lines[index])) {
			lastImport = index;
		}
	}

	if (lastImport === -1) {
		return `${line}\n${source}`;
	}

	lines.splice(lastImport + 1, 0, line);

	return lines.join('\n');
}

/**
 * Runs the generator.
 * @returns {number} process exit code
 */
function main() {
	const options = parseArgs(process.argv.slice(2));

	if (options.help === true) {
		usage();
		return 0;
	}

	if (typeof options.name !== 'string' || options.name.trim() === '') {
		usage();
		throw new Error('--name is required');
	}

	if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(options.name)) {
		throw new Error('--name must be kebab-case, e.g. order or sales-invoice');
	}

	const fields = parseFields(options.fields);
	const root = resolveRoot(options);

	const Name = pascalCase(options.name);
	const kebab = options.name;
	const camel = camelCase(options.name);
	const table = kebab.replace(/-/g, '_');
	const label = kebab.replace(/-/g, ' ');

	const view = {
		Name,
		kebab,
		camel,
		table,
		label,
		plural: pluralize(label),
		needsIndex: fields.some((field) => field.unique),
		needsNumeric: fields.some((field) => field.kind === 'numeric'),
		createImportBlock: renderRequestParts(fields, 'create').imports,
		updateImportBlock: renderRequestParts(fields, 'update').imports,
		searchableFields: ['id', ...fields.map((field) => field.property), 'createdAt'],
		sortableFields: ['id', ...fields.map((field) => field.property), 'createdAt'],
		fields: fields.map((field) => ({
			entityBlock: entityColumn(table, field),
			dtoBlock: dtoProperty(field),
			createBlock: stripMarker(requestProperty(field, 'create')),
			updateBlock: stripMarker(requestProperty(field, 'update'))
		}))
	};

	const featureDir = `src/presentation/api/v1/${kebab}`;
	const files = new Map([
		[`src/data/entity/${kebab}.entity.ts`, templates.entity(view)],
		[`src/data/repository/${kebab}.repository.ts`, templates.repository(view)],
		[`src/services/${kebab}/${kebab}.dto.ts`, templates.dto(view)],
		[`src/services/${kebab}/${kebab}.service.interface.ts`, templates.serviceInterface(view)],
		[`src/services/${kebab}/${kebab}.service.ts`, templates.service(view)],
		[`src/services/${kebab}/${kebab}.service.spec.ts`, templates.serviceSpec(view)],
		[`${featureDir}/request/${kebab}-create.request.ts`, templates.createRequest(view)],
		[`${featureDir}/request/${kebab}-update.request.ts`, templates.updateRequest(view)],
		[`${featureDir}/request/${kebab}-search.request.ts`, templates.searchRequest(view)],
		[`${featureDir}/response/${kebab}-search.response.ts`, templates.listResponse(view)],
		[`${featureDir}/${kebab}.controller.ts`, templates.controller(view)],
		[`${featureDir}/${kebab}.module.ts`, templates.module(view)]
	]);

	for (const relative of files.keys()) {
		const destination = join(root, relative);

		if (existsSync(destination)) {
			throw new Error(`refusing to overwrite an existing file: ${relative}`);
		}
	}

	// Registry wiring: two files, not five, thanks to the registry indirection.
	const dataRegistryPath = join(root, 'src/data/feature.registry.ts');
	let dataRegistry = readFileSync(dataRegistryPath, 'utf8');

	dataRegistry = addImport(dataRegistry, `import { ${Name}Entity } from './entity/${kebab}.entity';`);
	dataRegistry = addImport(
		dataRegistry,
		`import { ${Name}Repository, ${Name}RepositorySymbol } from './repository/${kebab}.repository';`
	);
	dataRegistry = insertIntoArray(dataRegistry, 'ENTITIES', `${Name}Entity`);
	dataRegistry = insertIntoArray(
		dataRegistry,
		'REPOSITORY_PROVIDERS',
		`{ provide: ${Name}RepositorySymbol, useClass: ${Name}Repository }`
	);
	dataRegistry = insertIntoArray(dataRegistry, 'REPOSITORY_EXPORTS', `${Name}RepositorySymbol`);

	const presentationRegistryPath = join(root, 'src/presentation/feature.registry.ts');
	let presentationRegistry = readFileSync(presentationRegistryPath, 'utf8');

	presentationRegistry = addImport(
		presentationRegistry,
		`import { ${Name}Module } from './api/v1/${kebab}/${kebab}.module';`
	);
	presentationRegistry = insertIntoArray(presentationRegistry, 'FEATURE_MODULES', `${Name}Module`);
	presentationRegistry = insertIntoArray(presentationRegistry, 'SWAGGER_TAGS', `'${kebab}'`);

	if (options.dryRun === true) {
		process.stdout.write(`\ndry run — ${files.size + 2} files would be written to ${root}\n\n`);

		for (const relative of files.keys()) {
			process.stdout.write(`  + ${relative}\n`);
		}

		process.stdout.write('  ~ src/data/feature.registry.ts\n  ~ src/presentation/feature.registry.ts\n\n');
		return 0;
	}

	for (const [relative, content] of files) {
		const destination = join(root, relative);
		mkdirSync(dirname(destination), { recursive: true });
		writeFileSync(destination, content);
	}

	writeFileSync(dataRegistryPath, dataRegistry);
	writeFileSync(presentationRegistryPath, presentationRegistry);

	process.stdout.write(`\ncreated ${files.size} files and wired 2 registries in ${root}\n\n`);
	process.stdout.write('Next:\n\n');
	process.stdout.write('  npm run format\n');
	process.stdout.write(`  npm run migration:generate -- src/data/migration/Add${Name}\n`);
	process.stdout.write('  npm run migration:run\n');
	process.stdout.write('  npm run lint:check && npm run typecheck\n\n');
	process.stdout.write(
		'Review the generated service spec — it is a skeleton, not a finished test.\n\n'
	);

	return 0;
}

try {
	process.exit(main());
} catch (error) {
	process.stderr.write(`\ngenerate-feature failed: ${error instanceof Error ? error.message : String(error)}\n\n`);
	process.exit(1);
}