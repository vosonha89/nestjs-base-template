import { Controller, Get, Inject } from "@nestjs/common";
import { IHelloWorldService } from 'src/core/application/interfaces/helloWorld.service.interface';
import { IRequestContextService } from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import { HelloWorldServiceSymbol } from "../../../core/application/services/helloWorld/helloWorld.service";
import { RequestContextServiceSymbol } from "../../../core/domain/common/service/requestContext.service";
import { Public } from "../../../core/application/decorators/public.decorator";

@Controller('hello')
export class HelloWorldController {
    /**
     * Creates an instance of HelloWorldController
     * @param helloWorldService - Service for hello world operations
     * @param requestContextService - Service for managing request context
     */
    public constructor(
        @Inject(HelloWorldServiceSymbol) private readonly helloWorldService: IHelloWorldService,
        @Inject(RequestContextServiceSymbol) private readonly requestContextService: IRequestContextService
    ) {
    }

    /**
     * Returns a hello world message
     * @returns A greeting string
     */
    @Public()
    @Get('get-hello')
    public getHello(): string {
        return this.helloWorldService.getHello();
    }
}
