import { IRequestContextService } from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import { IBaseDataService } from "./baseData.service.interface";
import { BaseType } from "./base.type";
import { IBaseRepository } from "./base.repository";
import { FindManyOptions, FindOptionsWhere } from "typeorm";
import { ConstantValue } from "../constant/constantValue";

export abstract class BaseDataService<T extends BaseType<ID>, ID> implements IBaseDataService<T, ID> {
    protected context: IRequestContextService;
    protected repository: IBaseRepository<T, ID>;

    /**
     * Constructor
     * @param requestContextService
     * @param dataRepository
     */
    constructor(
        requestContextService: IRequestContextService,
        dataRepository: IBaseRepository<T, ID>
    ) {
        this.context = requestContextService;
		this.repository = dataRepository;
    }

    findById(id: ID): Promise<T | null> {
        return this.repository.findById(id);
    }

    findBy(condition: FindManyOptions<T>, skip?: number, take?: number): Promise<T[]> {
        if (skip) skip = 0;
        if (take) take = ConstantValue.PAGE_SIZE;
        condition.skip = skip;
        condition.take = take;
        return this.repository.find(condition);
    }

    create(data: Partial<T>): Promise<T> {
        return this.repository.save(data);
    }

    update(id: ID, data: Partial<T>): Promise<T> {
        return this.repository.update(data);
    }

    delete(id: ID): Promise<boolean> {
        return this.repository.delete(id);
    }

    exists(id: ID): Promise<boolean> {
        return this.repository.exists(id);
    }

    existsBy(condition: FindOptionsWhere<T> | undefined): Promise<boolean> {
        return this.repository.existsBy(condition);
    }
}
