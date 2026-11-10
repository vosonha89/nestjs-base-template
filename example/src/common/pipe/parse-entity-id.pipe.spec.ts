import { AppError } from '../exception/client-error';
import { ParseEntityIdPipe } from './parse-entity-id.pipe';

describe('ParseEntityIdPipe', () => {
	let pipe: ParseEntityIdPipe;

	beforeEach(() => {
		pipe = new ParseEntityIdPipe();
	});

	it('should parse a numeric string', () => {
		expect(pipe.transform('42')).toEqual(42);
	});

	it('should accept a value already coerced by the global validation pipe', () => {
		expect(pipe.transform(42)).toEqual(42);
	});

	it.each(['0', '-1', 'abc', '1.5', '', ' '])('should reject the invalid identifier %p', (value: string) => {
		expect(() => pipe.transform(value)).toThrow(AppError);
	});

	it('should reject a non positive number', () => {
		expect(() => pipe.transform(0)).toThrow(AppError);
	});

	it('should report the 4002 error code', () => {
		try {
			pipe.transform('abc');
			fail('expected transform to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).exception.errorCode).toEqual('4002');
			expect((error as AppError).httpStatus).toEqual(400);
		}
	});
});
