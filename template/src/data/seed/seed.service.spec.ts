import { Test } from '@nestjs/testing';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { SEEDERS_TOKEN } from './seed.registry';
import { SeedService } from './seed.service';
import { ISeeder } from './seeder.interface';

describe('SeedService', () => {
	/**
	 * Builds a seeder stub.
	 * @param name - Name reported by the stub
	 * @returns The stub plus its `run` mock
	 */
	function seeder(name: string): { seeder: ISeeder; run: jest.Mock } {
		const run = jest.fn(() => Promise.resolve());

		return { seeder: { name, run }, run };
	}

	/**
	 * Builds the subject through the DI container so the token wiring is covered.
	 * @param seeders - Seeders to register
	 * @returns The resolved service plus the logger mock
	 */
	async function build(seeders: ISeeder[]): Promise<{ service: SeedService; logging: { info: jest.Mock } }> {
		const logging = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

		const moduleRef = await Test.createTestingModule({
			providers: [
				SeedService,
				{ provide: SEEDERS_TOKEN, useValue: seeders },
				{ provide: LoggingServiceSymbol, useValue: logging }
			]
		}).compile();

		return { service: moduleRef.get(SeedService), logging };
	}

	it('should do nothing when no seeder is registered', async () => {
		const { service, logging } = await build([]);

		await expect(service.run()).resolves.toBeUndefined();
		expect(logging.info).toHaveBeenCalledWith(expect.stringContaining('No seeders'), 'SeedService');
	});

	it('should run every registered seeder in order', async () => {
		const first = seeder('FirstSeeder');
		const second = seeder('SecondSeeder');
		const order: string[] = [];

		first.run.mockImplementation(() => {
			order.push('first');
			return Promise.resolve();
		});
		second.run.mockImplementation(() => {
			order.push('second');
			return Promise.resolve();
		});

		const { service } = await build([first.seeder, second.seeder]);
		await service.run();

		expect(order).toEqual(['first', 'second']);
		expect(first.run).toHaveBeenCalledTimes(1);
		expect(second.run).toHaveBeenCalledTimes(1);
	});

	it('should stop at the first failing seeder', async () => {
		const failing = seeder('FailingSeeder');
		const never = seeder('NeverSeeder');
		failing.run.mockRejectedValue(new Error('boom'));

		const { service } = await build([failing.seeder, never.seeder]);

		await expect(service.run()).rejects.toThrow('boom');
		expect(never.run).not.toHaveBeenCalled();
	});
});
