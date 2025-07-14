import {Inject} from '@nestjs/common';
import {IRequestContextService} from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import {RequestContextServiceSymbol} from "../service/requestContext.service";

export abstract class BaseService {
    protected context: IRequestContextService;

    /**
     * Constructor with request
     * @param requestContextService
     */
    constructor(
        @Inject(RequestContextServiceSymbol) private readonly requestContextService: IRequestContextService
    ) {
        this.context = requestContextService;
    }
}