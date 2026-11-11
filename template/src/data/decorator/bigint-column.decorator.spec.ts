import { getMetadataArgsStorage } from 'typeorm';
import { BigIntColumn, BigIntPrimaryColumn, numericTransformer } from './bigint-column.decorator';

/**
 * Entity declaring both decorators, so the registered metadata can be inspected.
 */
class Decorated {
	@BigIntPrimaryColumn({ name: 'id' })
	public id!: number;

	@BigIntColumn({ name: 'total', nullable: true })
	public total?: number;
}

/**
 * Reads the registered column options for a property.
 * @param propertyName - Property whose metadata is requested
 * @returns The `ColumnOptions` TypeORM stored
 */
function columnOptions(propertyName: string) {
	const column = getMetadataArgsStorage().columns.find(
		(candidate) => candidate.target === Decorated && candidate.propertyName === propertyName
	);

	if (column === undefined) {
		throw new Error(`No column metadata registered for ${propertyName}`);
	}

	return column.options;
}

describe('numericTransformer', () => {
	it('should parse the decimal string the driver returns', () => {
		expect(numericTransformer.from('129.99')).toEqual(129.99);
		expect(numericTransformer.from('-0.5')).toEqual(-0.5);
	});

	it('should map a missing decimal to null', () => {
		expect(numericTransformer.from(null)).toBeNull();
		expect(numericTransformer.from(undefined)).toBeNull();
	});

	it('should pass a number through untouched on the way to the driver', () => {
		expect(numericTransformer.to(12.5)).toEqual(12.5);
	});
});

describe('BigIntColumn', () => {
	it('should register a bigint column', () => {
		const options = columnOptions('total');

		expect(options.type).toEqual('bigint');
	});

	it('should register a bigint increment primary column', () => {
		const options = columnOptions('id');

		expect(options.type).toEqual('bigint');
		expect(options.generated).toEqual('increment');
	});

	it('should parse the driver bigint string into a JS number', () => {
		const transformer = columnOptions('id').transformer;

		if (transformer === undefined || Array.isArray(transformer)) {
			throw new Error('expected a single value transformer');
		}

		expect(transformer.from?.('9007199254740991')).toEqual(9007199254740991);
		expect(transformer.from?.(null)).toBeNull();
		expect(transformer.from?.(undefined)).toBeNull();
	});

	it('should pass a JS number through untouched on the way to the driver', () => {
		const transformer = columnOptions('id').transformer;

		if (transformer === undefined || Array.isArray(transformer)) {
			throw new Error('expected a single value transformer');
		}

		expect(transformer.to?.(42)).toEqual(42);
	});
});
