import { Module } from "@nestjs/common";
import { HelloWorldController } from "./helloWorld.controller";
import { HelloWorldService } from "../../../core/application/services/helloWorld.service";
import { RequestContextService } from 'src/core/application/services/requestContext.service';
import { IRequestContextService } from 'src/core/application/interfaces/requestContext.service.interface';
import { IHelloWorldService } from 'src/core/application/interfaces/helloWorld.service.interface';

@Module({
  imports: [],
  controllers: [
    HelloWorldController
  ],
  providers: [
    {
      provide: IHelloWorldService,
      useClass: HelloWorldService
    },
    {
      provide: IRequestContextService,
      useClass: RequestContextService
    },
  ],
})
export class HelloWorldModule { }
