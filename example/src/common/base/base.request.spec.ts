import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ConstantValue } from '../constant/constant-value';
import { FilterCondition } from '../constant/filter-condition';
import { BaseFilter, BaseFilterWhere, BaseGetByIdRequest, BaseSearchRequest, BaseSort } from './base.request';

/**
 * Validates a plain payload the way `AppValidationPipe` does.
 * @param target - Request class to instantiate
 * @param payload - Raw payload
 * @returns The list of constraint names that failed
 */
function violations(target: new () => object, payload: object): string[] {
	const instance = plainToInstance(target, payload);

	return validateSync(instance, { skipMissingProperties: false }).flatMap((error) =>
		Object.keys(error.constraints ?? {})
	);
}

describe('BaseSearchRequest', () => {
	it('should apply the documented defaults', () => {
		const request = new BaseSearchRequest();

		expect(request.page).toEqual(ConstantValue.PAGE_INDEX);
		expect(request.size).toEqual(ConstantValue.PAGE_SIZE);
		expect(request.count).toBe(false);
		expect(request.filters).toEqual([]);
		expect(request.sort).toBeUndefined();
	});

	it('should accept an empty payload', () => {
		expect(violations(BaseSearchRequest, {})).toEqual([]);
	});

	it('should reject a page index below one', () => {
		expect(violations(BaseSearchRequest, { page: 0 })).toContain('min');
	});

	it('should reject a page size above the hard cap', () => {
		expect(violations(BaseSearchRequest, { size: ConstantValue.MAX_PAGE_SIZE + 1 })).toContain('max');
	});

	it('should reject a non boolean count flag', () => {
		expect(violations(BaseSearchRequest, { count: 'yes' })).toContain('isBoolean');
	});

	it('should reject more than twenty filter clauses', () => {
		const filters = Array.from({ length: 21 }, () => ({
			fieldName: 'id',
			fieldValue: 1,
			filterCondition: FilterCondition.Equal
		}));

		expect(violations(BaseSearchRequest, { filters })).toContain('arrayMaxSize');
	});

	it('should accept a fully populated payload', () => {
		const payload = {
			page: 2,
			size: 25,
			count: true,
			filters: [{ fieldName: 'id', fieldValue: [1, 2, 3], filterCondition: FilterCondition.In }],
			sort: { sortField: 'createdAt', sortType: 'ASC' }
		};

		expect(violations(BaseSearchRequest, payload)).toEqual([]);
	});
});

describe('BaseFilter', () => {
	it('should require a field name and an operator', () => {
		const failed = violations(BaseFilter, { fieldValue: 1 });

		expect(failed).toEqual(expect.arrayContaining(['isString', 'isEnum']));
	});

	it('should reject an operator outside the catalogue', () => {
		expect(violations(BaseFilter, { fieldName: 'id', fieldValue: 1, filterCondition: '~~roughly' })).toContain(
			'isEnum'
		);
	});
});

describe('BaseFilterWhere', () => {
	it('should reject a blank value', () => {
		expect(violations(BaseFilterWhere, { fieldName: 'email', fieldValue: '' })).toContain('isNotEmpty');
	});
});

describe('BaseSort', () => {
	it('should only accept ASC or DESC', () => {
		expect(violations(BaseSort, { sortField: 'id', sortType: 'UP' })).toContain('isIn');
		expect(violations(BaseSort, { sortField: 'id', sortType: 'DESC' })).toEqual([]);
	});
});

describe('BaseGetByIdRequest', () => {
	it('should reject an identifier below one', () => {
		expect(violations(BaseGetByIdRequest, { id: 0 })).toContain('min');
	});

	it('should accept a positive identifier', () => {
		expect(violations(BaseGetByIdRequest, { id: 12 })).toEqual([]);
	});
});
