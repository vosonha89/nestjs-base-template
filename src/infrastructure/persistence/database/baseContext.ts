import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { IDatabaseService } from 'src/core/domain/common/service/interfaces/database.service.interface';
import { ILoggingService } from 'src/core/domain/common/service/interfaces/logging.service.interface';

/**
 * Base context for database connections using TypeORM
 */
@Injectable()
export abstract class BaseContext implements IDatabaseService, OnModuleInit, OnModuleDestroy {
  protected dataSource!: DataSource;
  protected isInitialized = false;

  protected constructor(
    protected readonly options: DataSourceOptions,
    protected readonly loggingService: ILoggingService
  ) {}

  /**
   * Gets the TypeORM DataSource instance
   */
  public getDataSource(): DataSource {
    if (!this.isInitialized) {
      throw new Error('Database connection is not initialized');
    }
    return this.dataSource;
  }

  /**
   * Initializes the database connection
   */
  public async initialize(): Promise<void> {
    try {
      if (!this.dataSource) {
        this.dataSource = new DataSource(this.options);
      }

      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
        this.isInitialized = true;
        this.loggingService.info('Database connection established', 'Database');
      }
    } catch (error) {
      this.loggingService.error('Failed to initialize database connection', error as Error, 'Database');
      throw error;
    }
  }

  /**
   * Closes the database connection
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        this.isInitialized = false;
        this.loggingService.info('Database connection closed', 'Database');
      }
    } catch (error) {
      this.loggingService.error('Failed to close database connection', error as Error, 'Database');
      throw error;
    }
  }

  /**
   * Initialize on module load
   */
  async onModuleInit() {
    await this.initialize();
  }

  /**
   * Disconnect on module
   */
  async onModuleDestroy() {
    await this.disconnect();
  }
}
