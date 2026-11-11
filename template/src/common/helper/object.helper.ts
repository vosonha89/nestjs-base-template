import { ClassConstructor, plainToInstance } from 'class-transformer';
import { DynamicRecord } from '../base/base.type';

/**
 * Options controlling how a source object is mapped onto a target class.
 */
export interface IMapOptions {
	/**
	 * When `true` (default) only properties decorated with `@Expose()` on the
	 * target are copied. Use this for entity -> DTO mapping so a column added
	 * to the entity later can never leak through the API by accident.
	 *
	 * Set to `false` when the source has already been sanitised — e.g. a request
	 * body that went through `AppValidationPipe` with `whitelist: true`.
	 */
	onlyExposed?: boolean;
}

/**
 * Mapping helpers shared by every layer.
 *
 * Replaces the `JSON.parse(JSON.stringify(...))` round-trip used by the
 * original template, which silently turned `Date` into `string`, dropped
 * `undefined` and was measurably slow.
 */
export class ObjectHelper {
	/**
	 * Maps a plain object onto a new instance of the target class.
	 * @param source - Plain object, usually an entity or a sanitised request
	 * @param targetType - Class to instantiate
	 * @param options - Mapping options, see {@link IMapOptions}
	 * @returns A new instance of `targetType`
	 */
	public static map<TTarget>(
		source: unknown,
		targetType: ClassConstructor<TTarget>,
		options: IMapOptions = {}
	): TTarget {
		return plainToInstance(targetType, source as object, {
			excludeExtraneousValues: options.onlyExposed !== false,
			enableImplicitConversion: false,
			ignoreDecorators: false
		});
	}

	/**
	 * Copies the defined properties of `source` onto an existing object.
	 *
	 * `undefined` values are skipped so a partial update never wipes a column,
	 * which is the behaviour a PATCH style request expects.
	 * @param source - Plain object carrying the new values
	 * @param target - Instance to mutate
	 * @param ignoredKeys - Keys that must never be overwritten, e.g. `id`
	 * @returns The mutated `target`
	 */
	public static assign<TTarget extends object>(
		source: unknown,
		target: TTarget,
		ignoredKeys: readonly string[] = []
	): TTarget {
		if (source === null || typeof source !== 'object') {
			return target;
		}

		const targetRecord: DynamicRecord = target as unknown as DynamicRecord;

		for (const [key, value] of Object.entries(source)) {
			if (value === undefined || ignoredKeys.includes(key)) {
				continue;
			}
			targetRecord[key] = value;
		}

		return target;
	}

	/**
	 * Builds a plain object containing only the defined own properties.
	 * Useful to feed TypeORM without leaking `undefined` columns.
	 * @param source - Object to compact
	 * @param ignoredKeys - Keys that must be dropped
	 * @returns A new plain object
	 */
	public static compact(source: object, ignoredKeys: readonly string[] = []): DynamicRecord {
		const result: DynamicRecord = {};
		const sourceRecord: DynamicRecord = source as unknown as DynamicRecord;

		for (const [key, value] of Object.entries(sourceRecord)) {
			if (value === undefined || ignoredKeys.includes(key)) {
				continue;
			}
			result[key] = value;
		}

		return result;
	}
}
