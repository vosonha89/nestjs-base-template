import {Controller, Get, Inject} from "@nestjs/common";
import {IHelloWorldService} from 'src/core/application/interfaces/helloWorld.service.interface';
import {IRequestContextService} from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import {HelloWorldServiceSymbol} from "../../../core/application/services/helloWorld/helloWorld.service";
import {RequestContextServiceSymbol} from "../../../core/domain/common/service/requestContext.service";

@Controller('hello')
export class HelloWorldController {
    constructor(
        @Inject(HelloWorldServiceSymbol) private readonly helloWorldService: IHelloWorldService,
        @Inject(RequestContextServiceSymbol) private readonly requestContextService: IRequestContextService
    ) {
    }

    @Get('get-hello')
    public getHello(): string {
        return this.helloWorldService.getHello();
    }
}
