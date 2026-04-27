import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    UserRepository,
    UserRepositorySymbol
} from "../../../../infrastructure/persistence/repositories/user.repository";
import {
    ProductRepository,
    ProductRepositorySymbol
} from "../../../../infrastructure/persistence/repositories/product.repository";
import { LoggingService, LoggingServiceSymbol } from "../service/logging.service";
import { PsqlContext, PsqlContextSymbol } from "../../../../infrastructure/persistence/database/psqlContext";
import { CommonModule } from "./common.module";

@Module({
    imports: [
		CommonModule
	],
    providers: [
        {
            provide: PsqlContextSymbol,
            // useClass: PsqlContext,
            useFactory: async (loggingService: LoggingService, configService: ConfigService) => {
                const psqlContext = new PsqlContext(loggingService, configService);
                await psqlContext.initialize();
                return psqlContext;
            },
            inject: [LoggingServiceSymbol, ConfigService]
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
	exports: [
		UserRepositorySymbol,
		ProductRepositorySymbol
	]
})

export class DataModule {
}
