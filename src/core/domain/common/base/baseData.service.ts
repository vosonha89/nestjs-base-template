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
import { BaseFilter, BaseSort } from "./base.request";
import { FilterCondition } from "../constant/filterCondition";

export abstract class BaseDataService<T extends BaseType<ID>, ID> implements IBaseDataService<T, ID> {
	protected context: IRequestContextService;
	protected repository: IBaseRepository<T, ID>;

	/**
	 * Constructor
	 * @param requestContextService
	 * @param dataRepository
	 */
	protected constructor(
		requestContextService: IRequestContextService,
		dataRepository: IBaseRepository<T, ID>
	) {
		this.context = requestContextService;
		this.repository = dataRepository;
	}

	public findById(id: ID): Promise<T | null> {
		return this.repository.findById(id);
	}

	public findBy(filters: BaseFilter[], sort: BaseSort, skip?: number, take?: number, count?: boolean): Promise<[
		data: T[],
		totalRecord: number
	]> {
		if (!skip) skip = 0;
		if (!take) take = ConstantValue.PAGE_SIZE;
		if (!count) count = false;
		const condition: FindManyOptions<T> = {};
		condition.skip = skip;
		condition.take = take;
		if (filters && filters.length > 0) {
			condition.where = {};
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
		if (sort) {
			condition.order = {};
			condition.order[sort.sortField] = sort.sortType;
		}
		const data = this.repository.find(condition);
		if (count) {
			const count = this.repository.count(condition);
			return Promise.all([data, count]);
		} else {
			return Promise.all([data, 0]);
		}
	}

	public create(data: Partial<T>): Promise<T> {
		return this.repository.save(data);
	}

	public update(id: ID, data: Partial<T>): Promise<T> {
		return this.repository.update(data);
	}

	public delete(id: ID): Promise<boolean> {
		return this.repository.delete(id);
	}

	public exists(id: ID): Promise<boolean> {
		return this.repository.exists(id);
	}

	public existsBy(condition: FindOptionsWhere<T> | undefined): Promise<boolean> {
		return this.repository.existsBy(condition);
	}
}
