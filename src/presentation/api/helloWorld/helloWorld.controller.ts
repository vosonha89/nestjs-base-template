import { Controller, Get, Inject } from "@nestjs/common";
import { IHelloWorldService } from './helloWorld.service';
import { IRequestContextService } from 'src/core/application/interfaces/requestContext.interface';

@Controller()
export class HelloWorldController {
  constructor(
    @Inject(IHelloWorldService) private readonly helloWorldService: IHelloWorldService,
    @Inject(IRequestContextService) private readonly requestContextService: IRequestContextService
  ) { }

  @Get()
  public getHello(): string {
    console.log(this.requestContextService.getRequest());
    return this.helloWorldService.getHello();
  }
}
