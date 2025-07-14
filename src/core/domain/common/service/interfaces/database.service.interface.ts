import { DataSource } from 'typeorm';

/**
 * Interface for database service
 * Provides methods for database connection management
 */
export interface IDatabaseService {
  /**
   * Gets the TypeORM DataSource instance
   */
  getDataSource(): DataSource;

  /**
   * Initializes the database connection
   */
  initialize(): Promise<void>;

  /**
   * Closes the database connection
   */
  disconnect(): Promise<void>;
}
