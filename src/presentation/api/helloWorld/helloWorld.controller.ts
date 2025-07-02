import { Controller, Get, Inject } from "@nestjs/common";
import {
  IHelloWorldService,
  IHelloWorldServiceSymbol
} from 'src/core/application/interfaces/helloWorld.service.interface';
import {
  IRequestContextService,
  IRequestContextServiceSymbol
} from 'src/core/application/interfaces/requestContext.service.interface';

@Controller('hello')
export class HelloWorldController {
  constructor(
    @Inject(IHelloWorldServiceSymbol) private readonly helloWorldService: IHelloWorldService,
    @Inject(IRequestContextServiceSymbol) private readonly requestContextService: IRequestContextService
  ) { }

  @Get('get-hello')
  public getHello(): string {
    return this.helloWorldService.getHello();
  }
}
