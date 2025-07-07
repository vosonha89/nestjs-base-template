import { Module } from "@nestjs/common";
import { HelloWorldController } from "./helloWorld.controller";
import { HelloWorldService } from "../../../core/application/services/helloWorld/helloWorld.service";
import { RequestContextService } from 'src/core/domain/common/service/requestContext.service';
import { IRequestContextServiceSymbol } from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import { IHelloWorldServiceSymbol } from 'src/core/application/interfaces/helloWorld.service.interface';

@Module({
  imports: [],
  controllers: [
    HelloWorldController
  ],
  providers: [
    {
      provide: IHelloWorldServiceSymbol,
      useClass: HelloWorldService
    },
    {
      provide: IRequestContextServiceSymbol,
      useClass: RequestContextService
    },
  ],
})
export class HelloWorldModule { }
