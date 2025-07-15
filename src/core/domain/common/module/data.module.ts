import {Module} from "@nestjs/common";
import {
    UserRepository,
    UserRepositorySymbol
} from "../../../../infrastructure/persistence/repositories/user.repository";
import {
    ProductRepository,
    ProductRepositorySymbol
} from "../../../../infrastructure/persistence/repositories/product.repository";
import {LoggingService, LoggingServiceSymbol} from "../service/logging.service";
import {PsqlContext, PsqlContextSymbol} from "../../../../infrastructure/persistence/database/psqlContext";

@Module({
    imports: [],
    providers: [
        {
            provide: LoggingServiceSymbol,
            useClass: LoggingService
        },
        {
            provide: PsqlContextSymbol,
            // useClass: PsqlContext,
            useFactory: async (loggingService: LoggingService) => {
                const psqlContext = new PsqlContext(loggingService);
                await psqlContext.initialize();
                return psqlContext;
            },
            inject: [LoggingServiceSymbol]
        },
        {
            provide: UserRepositorySymbol,
            useClass: UserRepository
        },
        {
            provide: ProductRepositorySymbol,
            useClass: ProductRepository
        },
    ],
})

export class DataModule {
}
