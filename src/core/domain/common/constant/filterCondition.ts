/**
 * Filter condition
 */
export enum FilterCondition {
	Like = '~',
	Equal = '=',
	In = '^',
	NotIn = '!^',
	NotEqual = '!=',
	GreaterThan = '>',
	GreaterThanOrEqual = '>=',
	LessThan = '<',
	LessThanOrEqual = '<=',
	Between = '<>',
	NotBetween = '!<>'
}
