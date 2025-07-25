import { IRequestContextService } from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import { IBaseDataService } from "./baseData.service.interface";
import { BaseType } from "./base.type";
import { IBaseRepository } from "./base.repository";
import {
	Between,
	Equal,
	FindManyOptions,
	FindOptionsWhere, In,
	LessThan,
	LessThanOrEqual,
	Like,
	MoreThan,
	MoreThanOrEqual,
	Not
} from "typeorm";
import { ConstantValue } from "../constant/constantValue";
import { BaseFilter, BaseFilterWhere, BaseSort } from "./base.request";
import { FilterCondition } from "../constant/filterCondition";
import { BaseEntity } from "./base.entity";
import { Type } from "@nestjs/common";
import { ObjectHelper } from "../../helpers/objectHelper";

export function BaseDataService<T extends BaseType<ID>, TEntity extends BaseEntity<ID>, ID>(dto: Type<T>, entity: Type<TEntity>) {
	abstract class BaseDataServiceWrapper implements IBaseDataService<T, ID> {
		context: IRequestContextService;
		repository: IBaseRepository<TEntity, ID>;

		/**
		 * Constructor
		 * @param requestContextService
		 * @param dataRepository
		 */
		protected constructor(
			requestContextService: IRequestContextService,
			dataRepository: IBaseRepository<TEntity, ID>
		) {
			this.context = requestContextService;
			this.repository = dataRepository;
		}

		public async findById(id: ID): Promise<T | undefined> {
			const entity: TEntity | null = await this.repository.findById(id);
			if (!entity) return undefined;
			else {
				const returnDto = new dto();
				ObjectHelper.map(entity, returnDto);
				return returnDto;
			}
		}

		public async findBy(filters: BaseFilter[], sort: BaseSort, skip?: number, take?: number, count?: boolean):
			Promise<{ data: T[], totalRecord: number }> {
			if (!skip) skip = 0;
			if (!take) take = ConstantValue.PAGE_SIZE;
			if (!count) count = false;
			const condition: FindManyOptions<T> = {};
			condition.skip = skip;
			condition.take = take;
			condition.where = {};
			if (filters && filters.length > 0) {
				for (const filter of filters) {
					switch (filter.filterCondition) {
						case FilterCondition.Like:
							condition.where[filter.fieldName] = Like('%' + String(filter.fieldValue) + '%');
							break;
						case FilterCondition.Equal:
							condition.where[filter.fieldName] = Equal(filter.fieldValue);
							break;
						case FilterCondition.In:
							condition.where[filter.fieldName] = In(filter.fieldValue as []);
							break;
						case FilterCondition.NotIn:
							condition.where[filter.fieldName] = Not(In(filter.fieldValue as []));
							break;
						case FilterCondition.GreaterThan:
							condition.where[filter.fieldName] = MoreThan(filter.fieldValue);
							break;
						case FilterCondition.GreaterThanOrEqual:
							condition.where[filter.fieldName] = MoreThanOrEqual(filter.fieldValue);
							break;
						case FilterCondition.LessThan:
							condition.where[filter.fieldName] = LessThan(filter.fieldValue);
							break;
						case FilterCondition.LessThanOrEqual:
							condition.where[filter.fieldName] = LessThanOrEqual(filter.fieldValue);
							break;
						case FilterCondition.NotEqual:
							condition.where[filter.fieldName] = Not(filter.fieldValue);
							break;
						case FilterCondition.Between:
							condition.where[filter.fieldName] = Between(filter.fieldValue[0], filter.fieldValue[1]);
							break;
						case FilterCondition.NotBetween:
							condition.where[filter.fieldName] = Not(Between(filter.fieldValue[0], filter.fieldValue[1]));
							break;
						default:
							break;
					}
				}
			}
			condition.order = {};
			if (sort) {
				condition.order[sort.sortField] = sort.sortType;
			}
			const data = this.repository.find(condition);
			let result: [TEntity[], number];
			if (count) {
				const count = this.repository.count(condition);
				result = await Promise.all([data, count]);

			} else {
				result = await Promise.all([data, 0]);
			}
			const elements: TEntity[] = result[0];
			const elementDtos: T[] = elements.map((entity: TEntity) => {
				const returnDto = new dto();
				ObjectHelper.map(entity, returnDto);
				return returnDto;
			});
			return { data: elementDtos, totalRecord: result[1] };
		}

		public async create(data: Partial<T>): Promise<T> {
			let entityInDB: TEntity = new entity();
			ObjectHelper.map(data, entityInDB);
			entityInDB = await this.repository.save(entityInDB);
			entityInDB.createdAt = new Date();
			const returnDto = new dto();
			ObjectHelper.map(entityInDB, returnDto);
			return returnDto;
		}

		public async update(id: ID, data: Partial<T>): Promise<T> {
			let entityInDB: TEntity | null = await this.repository.findById(id);
			if (!entityInDB) throw new Error('Entity not found');
			ObjectHelper.map(data, entityInDB);
			entityInDB.updatedAt = new Date();
			entityInDB = await this.repository.update(entityInDB);
			const returnDto = new dto();
			ObjectHelper.map(entityInDB, returnDto);
			return returnDto;
		}

		public async delete(id: ID): Promise<boolean | void> {
			const entityInDB: TEntity | null = await this.repository.findById(id);
			if (!entityInDB) throw new Error('Entity not found');
			else {
				await this.repository.delete(id);
			}
		}

		public async exists(id: ID): Promise<boolean> {
			const entityInDB: TEntity | null = await this.repository.findById(id);
			if (!entityInDB) throw new Error('Entity not found');
			else {
				return this.repository.exists(id);
			}
		}

		public existsBy(filters: BaseFilterWhere[]): Promise<boolean> {
			const condition: FindOptionsWhere<TEntity> = {};
			if (filters && filters.length > 0) {
				for (const filter of filters) {
					condition[filter.fieldName] = Equal(filter.fieldValue);
				}
			}
			return this.repository.existsBy(condition);
		}
	}

	return BaseDataServiceWrapper;
}

