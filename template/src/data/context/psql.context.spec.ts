import { DataSource, Repository } from 'typeorm';
import { PsqlContext } from './psql.context';

describe('PsqlContext', () => {
	/**
	 * Builds a context over a stubbed data source.
	 * @param initialized - Value returned by `isInitialized`
	 * @returns The context plus the stub, so assertions can inspect it
	 */
	function build(initialized: boolean): { context: PsqlContext; dataSource: jest.Mocked<DataSource> } {
		const repository = {} as Repository<object>;
		const dataSource = {
			isInitialized: initialized,
			getRepository: jest.fn(() => repository)
		} as unknown as jest.Mocked<DataSource>;

		return { context: new PsqlContext(dataSource), dataSource };
	}

	it('should report readiness from the underlying data source', () => {
		expect(build(true).context.isReady()).toBe(true);
		expect(build(false).context.isReady()).toBe(false);
	});

	it('should delegate getRepository to the data source', () => {
		const { context, dataSource } = build(true);
		const target = class Target {};

		context.getRepository(target);

		expect(dataSource.getRepository).toHaveBeenCalledWith(target);
	});

	it('should refuse a repository lookup before the pool is ready', () => {
		const { context } = build(false);

		expect(() => context.getRepository(class Target {})).toThrow(/not initialised/i);
	});

	it('should expose the raw data source for explicit transactions', () => {
		const { context, dataSource } = build(true);

		expect(context.getDataSource()).toBe(dataSource);
	});
});
