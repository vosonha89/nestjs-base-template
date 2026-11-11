import { Expose } from 'class-transformer';
import { FindManyOptions } from 'typeorm';
import { createRequestContextMock } from '@test/support/test-doubles';
import { ConstantValue } from '../constant/constant-value';
import { FilterCondition } from '../constant/filter-condition';
import { AppError } from '../exception/client-error';
import { IRequestContextService } from '../service/request-context.service.interface';
import { BaseEntity } from './base.entity';
import { BaseFilter } from './base.request';
import { IBaseRepository } from './base.repository';
import { BaseType } from './base.type';
import { BaseDataService } from './base-data.service';

/** DTO used by the test service, with one non-exposed property. */
class WidgetDto extends BaseType<number> {
	@Expose()
	public id!: number;

	@Expose()
	public name?: string;

	/** Deliberately not exposed: must never reach the mapper output. */
	public secret?: string;
}

/** Entity used by the test service. */
class WidgetEntity extends BaseEntity<number> {
	public override id!: number;

	public override createdAt!: Date;

	public override updatedAt!: Date;

	public name?: string;

	public secret?: string;
}

/** Concrete service under test. */
class WidgetService extends BaseDataService<WidgetDto, WidgetEntity, number> {
	public constructor(context: IRequestContextService, repository: IBaseRepository<WidgetEntity, number>) {
		super(context, repository, {
			dto: WidgetDto,
			entity: WidgetEntity,
			searchableFields: ['id', 'name'],
			defaultSortField: 'name',
			defaultSortDirection: 'ASC'
		});
	}
}

/**
 * Builds a fully mocked repository.
 * @returns The mock
 */
function createRepositoryMock(): jest.Mocked<IBaseRepository<WidgetEntity, number>> {
	return {
		findById: jest.fn(),
		findOne: jest.fn(),
		find: jest.fn(),
		count: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		exists: jest.fn(),
		existsBy: jest.fn()
	};
}

/**
 * Builds an entity fixture.
 * @param overrides - Fields to replace
 * @returns The fixture
 */
function createEntity(overrides: Partial<WidgetEntity> = {}): WidgetEntity {
	return Object.assign(new WidgetEntity(), {
		id: 1,
		name: 'widget',
		secret: 'classified',
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		...overrides
	});
}

/**
 * Builds a filter clause.
 * @param fieldName - Column to filter on
 * @param fieldValue - Value to compare
 * @param filterCondition - Comparison operator
 * @returns The clause
 */
function createFilter(
	fieldName: string,
	fieldValue: BaseFilter['fieldValue'],
	filterCondition: FilterCondition = FilterCondition.Equal
): BaseFilter {
	return { fieldName, fieldValue, filterCondition };
}

describe('BaseDataService', () => {
	let service: WidgetService;
	let repository: jest.Mocked<IBaseRepository<WidgetEntity, number>>;

	beforeEach(() => {
		repository = createRepositoryMock();
		service = new WidgetService(createRequestContextMock(), repository);
	});

	describe('findById', () => {
		it('should map the entity onto the DTO without leaking non exposed fields', async () => {
			repository.findById.mockResolvedValue(createEntity());

			const result = await service.findById(1);

			expect(result).toBeInstanceOf(WidgetDto);
			expect(result?.id).toEqual(1);
			expect(result?.name).toEqual('widget');
			expect(result?.secret).toBeUndefined();
		});

		it('should return undefined when the record does not exist', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(service.findById(404)).resolves.toBeUndefined();
		});
	});

	describe('findBy', () => {
		it('should reject a filter on a non searchable column with 4007', async () => {
			await expect(service.findBy([createFilter('secret', 'classified')])).rejects.toMatchObject({
				exception: { errorCode: '4007' }
			});
			expect(repository.find).not.toHaveBeenCalled();
		});

		it('should reject a sort on a non sortable column with 4007', async () => {
			await expect(service.findBy([], { sortField: 'secret', sortType: 'ASC' })).rejects.toBeInstanceOf(AppError);
			expect(repository.find).not.toHaveBeenCalled();
		});

		it('should apply pagination, the default sort and an id tie breaker', async () => {
			repository.find.mockResolvedValue([]);
			repository.count.mockResolvedValue(0);

			await service.findBy([], undefined, 10, 5, false);

			const options = repository.find.mock.calls[0][0] as FindManyOptions<WidgetEntity>;
			expect(options.skip).toEqual(10);
			expect(options.take).toEqual(5);
			expect(options.order).toEqual({ name: 'ASC', id: 'ASC' });
			expect(repository.count).not.toHaveBeenCalled();
		});

		it('should clamp the page size to MAX_PAGE_SIZE', async () => {
			repository.find.mockResolvedValue([]);

			await service.findBy([], undefined, 0, ConstantValue.MAX_PAGE_SIZE + 500, false);

			const options = repository.find.mock.calls[0][0] as FindManyOptions<WidgetEntity>;
			expect(options.take).toEqual(ConstantValue.MAX_PAGE_SIZE);
		});

		it('should run the count query only when explicitly requested', async () => {
			repository.find.mockResolvedValue([createEntity()]);
			repository.count.mockResolvedValue(41);

			const result = await service.findBy([], undefined, 0, 10, true);

			expect(repository.count).toHaveBeenCalledTimes(1);
			expect(result.totalRecord).toEqual(41);
			expect(result.elements).toHaveLength(1);
		});

		it('should translate every operator without throwing', async () => {
			repository.find.mockResolvedValue([]);

			await service.findBy([
				createFilter('name', 'wid', FilterCondition.Like),
				createFilter('id', [1, 2], FilterCondition.In),
				createFilter('id', [1, 2], FilterCondition.NotIn),
				createFilter('id', 2, FilterCondition.NotEqual),
				createFilter('id', 1, FilterCondition.GreaterThan),
				createFilter('id', 1, FilterCondition.GreaterThanOrEqual),
				createFilter('id', 9, FilterCondition.LessThan),
				createFilter('id', 9, FilterCondition.LessThanOrEqual),
				createFilter('id', [1, 9], FilterCondition.Between),
				createFilter('id', [1, 9], FilterCondition.NotBetween)
			]);

			const options = repository.find.mock.calls[0][0] as FindManyOptions<WidgetEntity>;
			expect(Object.keys(options.where ?? {}).sort()).toEqual(['id', 'name']);
		});

		it('should reject BETWEEN with the wrong number of bounds', async () => {
			await expect(service.findBy([createFilter('id', [1], FilterCondition.Between)])).rejects.toMatchObject({
				exception: { errorCode: '4002' }
			});
		});
	});

	describe('create', () => {
		it('should ignore the identifier and the audit columns', async () => {
			repository.save.mockImplementation(async (entity: WidgetEntity) => entity);

			await service.create({
				id: 99,
				name: 'new',
				createdAt: new Date(),
				updatedAt: new Date()
			} as Partial<WidgetDto>);

			const saved = repository.save.mock.calls[0][0];
			expect(saved.name).toEqual('new');
			expect(saved.id).toBeUndefined();
		});
	});

	describe('update', () => {
		it('should throw 404 when the record does not exist', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(service.update(404, { name: 'x' })).rejects.toMatchObject({
				httpStatus: 404,
				exception: { errorCode: '404' }
			});
			expect(repository.update).not.toHaveBeenCalled();
		});

		it('should persist the merged entity', async () => {
			repository.findById.mockResolvedValue(createEntity());
			repository.update.mockImplementation(async (entity: WidgetEntity) => entity);

			const result = await service.update(1, { name: 'renamed' });

			expect(result.name).toEqual('renamed');
			expect(repository.update).toHaveBeenCalledTimes(1);
		});
	});

	describe('delete', () => {
		it('should return false when the record does not exist', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(service.delete(404)).resolves.toBe(false);
			expect(repository.delete).not.toHaveBeenCalled();
		});

		it('should delegate to the repository when it exists', async () => {
			repository.findById.mockResolvedValue(createEntity());
			repository.delete.mockResolvedValue(true);

			await expect(service.delete(1)).resolves.toBe(true);
		});
	});

	describe('existsBy', () => {
		it('should reject a condition on a non searchable column', async () => {
			await expect(service.existsBy([{ fieldName: 'secret', fieldValue: 'x' }])).rejects.toMatchObject({
				exception: { errorCode: '4007' }
			});
			expect(repository.existsBy).not.toHaveBeenCalled();
		});

		it('should build an equality condition for allowed columns', async () => {
			repository.existsBy.mockResolvedValue(true);

			await expect(service.existsBy([{ fieldName: 'name', fieldValue: 'widget' }])).resolves.toBe(true);
			expect(repository.existsBy).toHaveBeenCalledTimes(1);
		});
	});
});
