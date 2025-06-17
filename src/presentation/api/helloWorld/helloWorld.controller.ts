import { Controller, Get, Inject } from "@nestjs/common";
import { IHelloWorldService } from 'src/core/application/interfaces/helloWorld.service.interface';
import { IRequestContextService } from 'src/core/application/interfaces/requestContext.service.interface';

@Controller('hello')
export class HelloWorldController {
  constructor(
    @Inject(IHelloWorldService) private readonly helloWorldService: IHelloWorldService,
    @Inject(IRequestContextService) private readonly requestContextService: IRequestContextService
  ) { }

  @Get('get-hello')
  public getHello(): string {
    return this.helloWorldService.getHello();
  }
}
