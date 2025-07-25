import { Inject, Injectable } from '@nestjs/common';
import { BaseContext } from './baseContext';
import { ILoggingService } from 'src/core/domain/common/service/interfaces/logging.service.interface';
import { DataSourceOptions } from "typeorm";
import { LoggingServiceSymbol } from "../../../core/domain/common/service/logging.service";
import { AppEnvironment } from "../../../core/domain/configuration/appEnvironment";

/**
 * Service symbol for DI register
 */
export const PsqlContextSymbol = Symbol("PsqlContext");

/**
 * PostgresQL database context implementation
 */
@Injectable()
export class PsqlContext extends BaseContext {
    constructor(
        @Inject(LoggingServiceSymbol) readonly loggingService: ILoggingService,
    ) {
		console.log('ENV - ' +  AppEnvironment.value.ENV);
        const options = {
            type: 'postgres',
            host: AppEnvironment.value.DB_HOST || 'localhost',
            port: parseInt(AppEnvironment.value.DB_PORT || '5432', 10),
            username: AppEnvironment.value.DB_USERNAME || 'postgres',
            password: AppEnvironment.value.DB_PASSWORD || 'postgres',
            database: AppEnvironment.value.DB_DATABASE || 'nestjs_db',
            ssl: {
                rejectUnauthorized: false, // only for self-signed certs
            },
            entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
            synchronize: AppEnvironment.value.ENV === 'production',
            logging: AppEnvironment.value.ENV === 'production',
        } as DataSourceOptions;
        console.log(options);
        super(options, loggingService);
    }
}
