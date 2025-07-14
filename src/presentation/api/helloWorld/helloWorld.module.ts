import {Module} from "@nestjs/common";
import {HelloWorldController} from "./helloWorld.controller";
import {
    HelloWorldService,
    HelloWorldServiceSymbol
} from "../../../core/application/services/helloWorld/helloWorld.service";
import {
    RequestContextService,
    RequestContextServiceSymbol
} from 'src/core/domain/common/service/requestContext.service';

@Module({
    imports: [],
    controllers: [
        HelloWorldController
    ],
    providers: [
        {
            provide: HelloWorldServiceSymbol,
            useClass: HelloWorldService
        },
        {
            provide: RequestContextServiceSymbol,
            useClass: RequestContextService
        },
    ],
})
export class HelloWorldModule {
}
