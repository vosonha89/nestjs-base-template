import { Module } from "@nestjs/common";
import { HelloWorldController } from "./helloWorld.controller";
import { HelloWorldService, IHelloWorldService } from "./helloWorld.service";

@Module({
  imports: [],
  controllers: [
    HelloWorldController
  ],
  providers: [
    {
      provide: IHelloWorldService,
      useClass: HelloWorldService
    }
  ],
})
export class HelloWorldModule { }
