import { FindManyOptions, Repository } from 'typeorm';
import { PsqlEntity } from '../entity/psql.entity';
import { PsqlContext } from '../context/psql.context';
import { PsqlRepository } from './psql.repository';

/**
 * Minimal entity used to exercise the generic repository.
 */
class SampleEntity extends PsqlEntity<number> {
	public override id!: number;
	public name!: string;
}

/**
 * Concrete repository: `PsqlRepository` has a protected constructor on purpose.
 */
class SampleRepository extends PsqlRepository<SampleEntity, number> {
	public constructor(context: PsqlContext) {
		super(context, SampleEntity);
	}
}

describe('PsqlRepository', () => {
	let repository: jest.Mocked<
		Pick<
			Repository<SampleEntity>,
			'create' | 'findOne' | 'find' | 'count' | 'save' | 'update' | 'softDelete' | 'exists'
		>
	>;
	let context: PsqlContext;
	let subject: SampleRepository;

	beforeEach(() => {
		repository = {
			create: jest.fn(),
			findOne: jest.fn(),
			find: jest.fn(),
			count: jest.fn(),
			save: jest.fn(),
			update: jest.fn(),
			softDelete: jest.fn(),
			exists: jest.fn()
		};

		context = { getRepository: jest.fn(() => repository) } as unknown as PsqlContext;
		subject = new SampleRepository(context);
	});

	/**
	 * Builds an entity fixture.
	 * @returns The fixture
	 */
	function sample(): SampleEntity {
		const entity = new SampleEntity();
		entity.id = 7;
		entity.name = 'widget';
		return entity;
	}

	it('should obtain its TypeORM repository from the context', () => {
		expect(context.getRepository).toHaveBeenCalledWith(SampleEntity);
	});

	it('should delegate createEntity to the driver so column defaults apply', () => {
		const created = sample();
		repository.create.mockReturnValue(created);

		expect(subject.createEntity()).toBe(created);
	});

	it('should find by primary key', async () => {
		const entity = sample();
		repository.findOne.mockResolvedValue(entity);

		await expect(subject.findById(7)).resolves.toBe(entity);
		expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
	});

	it('should find one by an arbitrary condition', async () => {
		repository.findOne.mockResolvedValue(null);

		await expect(subject.findOne({ name: 'widget' })).resolves.toBeNull();
		expect(repository.findOne).toHaveBeenCalledWith({ where: { name: 'widget' } });
	});

	it('should pass find options through unchanged', async () => {
		const options: FindManyOptions<SampleEntity> = { take: 5, order: { id: 'DESC' } };
		repository.find.mockResolvedValue([sample()]);

		await expect(subject.find(options)).resolves.toHaveLength(1);
		expect(repository.find).toHaveBeenCalledWith(options);
	});

	it('should count matching rows', async () => {
		repository.count.mockResolvedValue(3);

		await expect(subject.count({ where: { name: 'widget' } })).resolves.toBe(3);
	});

	it('should save an entity', async () => {
		const entity = sample();
		repository.save.mockResolvedValue(entity);

		await expect(subject.save(entity)).resolves.toBe(entity);
	});

	it('should update without ever writing id, createdAt or deletedAt', async () => {
		const entity = sample();
		entity.createdAt = new Date('2024-01-01T00:00:00.000Z');
		entity.deletedAt = null;

		await subject.update(entity);

		const [where, patch] = repository.update.mock.calls[0];

		expect(where).toEqual({ id: 7 });
		expect(patch).not.toHaveProperty('id');
		expect(patch).not.toHaveProperty('createdAt');
		expect(patch).not.toHaveProperty('deletedAt');
		// `Repository.update()` skips the `@UpdateDateColumn` listener, so the
		// repository stamps it explicitly — that is the invariant under test.
		expect(patch).toHaveProperty('updatedAt');
	});

	it('should report whether a soft delete affected a row', async () => {
		repository.softDelete.mockResolvedValueOnce({ affected: 1, raw: [], generatedMaps: [] });
		await expect(subject.delete(7)).resolves.toBe(true);

		repository.softDelete.mockResolvedValueOnce({ affected: 0, raw: [], generatedMaps: [] });
		await expect(subject.delete(7)).resolves.toBe(false);

		// `affected` is optional in the driver type; `undefined` must read as "no".
		repository.softDelete.mockResolvedValueOnce({ raw: [], generatedMaps: [] });
		await expect(subject.delete(7)).resolves.toBe(false);
	});

	it('should check existence by id and by condition', async () => {
		repository.exists.mockResolvedValueOnce(true);
		await expect(subject.exists(7)).resolves.toBe(true);
		expect(repository.exists).toHaveBeenLastCalledWith({ where: { id: 7 } });

		repository.exists.mockResolvedValueOnce(false);
		await expect(subject.existsBy({ name: 'widget' })).resolves.toBe(false);
		expect(repository.exists).toHaveBeenLastCalledWith({ where: { name: 'widget' } });
	});
});
