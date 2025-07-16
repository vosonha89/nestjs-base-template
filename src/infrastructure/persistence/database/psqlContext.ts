import { Inject, Injectable } from '@nestjs/common';
import { BaseContext } from './baseContext';
import { ILoggingService } from 'src/core/domain/common/service/interfaces/logging.service.interface';
import { DataSourceOptions } from "typeorm";
import { LoggingServiceSymbol } from "../../../core/domain/common/service/logging.service";

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
        const options = {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_DATABASE || 'nestjs_db',
            ssl: {
                rejectUnauthorized: false, // only for self-signed certs
            },
            entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV !== 'production',
        } as DataSourceOptions;
        console.log(options);
        super(options, loggingService);
    }
}