/**
 * Comparison operators accepted in `BaseFilter.filterCondition`.
 *
 * The single character tokens are part of the public API contract, so they are
 * kept stable even though they look cryptic in isolation.
 */
export enum FilterCondition {
	/** Case sensitive `LIKE %value%`. */
	Like = '~',

	/** `= value`. */
	Equal = '=',

	/** `value IN (...)`. `fieldValue` must be an array. */
	In = '^',

	/** `value NOT IN (...)`. `fieldValue` must be an array. */
	NotIn = '!^',

	/** `<> value`. */
	NotEqual = '!=',

	/** `> value`. */
	GreaterThan = '>',

	/** `>= value`. */
	GreaterThanOrEqual = '>=',

	/** `< value`. */
	LessThan = '<',

	/** `<= value`. */
	LessThanOrEqual = '<=',

	/** `BETWEEN a AND b`. `fieldValue` must be a two element array. */
	Between = '<>',

	/** `NOT BETWEEN a AND b`. `fieldValue` must be a two element array. */
	NotBetween = '!<>'
}
