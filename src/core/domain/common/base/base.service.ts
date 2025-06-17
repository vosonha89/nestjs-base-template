import { Inject } from '@nestjs/common';
import { IRequestContextService } from 'src/core/application/interfaces/requestContext.service.interface';

export abstract class BaseService {
    protected context: IRequestContextService;

    /**
     * Constructor with request
     * @param requestContextService 
     */
    constructor(
        @Inject(IRequestContextService) private readonly requestContextService: IRequestContextService
    ) {
        this.context = requestContextService;
    }
}