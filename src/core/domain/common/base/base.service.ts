import { Inject } from '@nestjs/common';
import {
    IRequestContextService,
    IRequestContextServiceSymbol
} from 'src/core/application/interfaces/requestContext.service.interface';

export abstract class BaseService {
    protected context: IRequestContextService;

    /**
     * Constructor with request
     * @param requestContextService 
     */
    constructor(
        @Inject(IRequestContextServiceSymbol) private readonly requestContextService: IRequestContextService
    ) {
        this.context = requestContextService;
    }
}