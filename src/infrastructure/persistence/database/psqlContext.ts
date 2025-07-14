import { Injectable } from '@nestjs/common';
import { DataSourceOptions } from 'typeorm';
import { BaseContext } from './baseContext';
import { ILoggingService } from 'src/core/domain/common/service/interfaces/logging.service.interface';

/**
 * PostgresQL database context implementation
 */
@Injectable()
export class PsqlContext extends BaseContext {
  constructor(
    loggingService: ILoggingService
  ) {
    // Configure PostgresQL connection options
    const options: DataSourceOptions = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'nestjs_db',
      entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    };

    super(options, loggingService);
  }
}