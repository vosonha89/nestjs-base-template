import { ArgumentMetadata } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { ValidationAppError } from '../exception/client-error';
import { AppValidationPipe } from './app-validation.pipe';

/** Nested payload used to prove the error tree is walked to the leaf. */
class NestedPayload {
	@IsNotEmpty({ message: 'inner is required' })
	@IsString()
	public inner!: string;
}

/** Top level payload. */
class TestPayload {
	@IsNotEmpty({ message: 'name is required' })
	@IsString()
	@MaxLength(5, { message: 'name is too long' })
	public name!: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => NestedPayload)
	public nested?: NestedPayload;
}

/** Metadata describing a body parameter. */
const BODY_METADATA: ArgumentMetadata = { type: 'body', metatype: TestPayload };

describe('AppValidationPipe', () => {
	let pipe: AppValidationPipe;

	beforeEach(() => {
		pipe = new AppValidationPipe();
	});

	it('should return the transformed instance when the payload is valid', async () => {
		const result = (await pipe.transform({ name: 'abc' }, BODY_METADATA)) as TestPayload;

		expect(result).toBeInstanceOf(TestPayload);
		expect(result.name).toEqual('abc');
	});

	it('should report a missing required field as 4001', async () => {
		await expect(pipe.transform({}, BODY_METADATA)).rejects.toMatchObject({
			exception: { errorCode: '4001', errorMessage: 'name is required' }
		});
	});

	it('should report a maxLength violation as 4003', async () => {
		await expect(pipe.transform({ name: 'far-too-long' }, BODY_METADATA)).rejects.toMatchObject({
			exception: { errorCode: '4003' }
		});
	});

	it('should walk into nested errors instead of blaming the parent', async () => {
		const failure = pipe.transform({ name: 'abc', nested: {} }, BODY_METADATA);

		await expect(failure).rejects.toBeInstanceOf(ValidationAppError);
		await expect(failure).rejects.toMatchObject({
			exception: { errorCode: '4001', errorMessage: 'inner is required' }
		});
	});

	it('should reject an unknown property with 4002', async () => {
		await expect(pipe.transform({ name: 'abc', injected: 'x' }, BODY_METADATA)).rejects.toMatchObject({
			exception: { errorCode: '4002' }
		});
	});

	it('should not validate when the metatype is a primitive', async () => {
		const result = await pipe.transform('plain', { type: 'param', metatype: String });

		expect(result).toEqual('plain');
	});
});
