import { Inject, Injectable } from '@nestjs/common';
import { BaseContext } from './baseContext';
import { ILoggingService } from 'src/core/domain/common/service/interfaces/logging.service.interface';
import { DataSourceOptions } from "typeorm";
import { LoggingServiceSymbol } from "../../../core/domain/common/service/logging.service";
import { ConfigService } from "@nestjs/config";

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
        private readonly configService: ConfigService,
    ) {
		const env = configService.get<string>('ENV');
		console.log('ENV - ' +  env);
        const options = {
            type: 'postgres',
            host: configService.get<string>('DB_HOST') || 'localhost',
            port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
            username: configService.get<string>('DB_USERNAME') || 'postgres',
            password: configService.get<string>('DB_PASSWORD') || 'postgres',
            database: configService.get<string>('DB_DATABASE') || 'nestjs_db',
            ssl: {
                rejectUnauthorized: false, // only for self-signed certs
            },
            entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
            synchronize: env === 'production',
            logging: env === 'production',
        } as DataSourceOptions;
        console.log(options);
        super(options, loggingService);
    }
}
