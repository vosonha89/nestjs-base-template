import { Controller, Get, Inject } from "@nestjs/common";
import { IHelloWorldService } from './helloWorld.service';

@Controller()
export class HelloWorldController {
  constructor(
    @Inject(IHelloWorldService) private readonly helloWorldService: IHelloWorldService
  ) { }

  @Get()
  getHello(): string {
    return this.helloWorldService.getHello();
  }
}
