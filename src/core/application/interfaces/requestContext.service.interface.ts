import { RequestWithUser } from 'src/core/domain/types/requestWithUser.type';
import { UserInfo } from 'src/core/domain/types/userInfo.type';

/**
 * Service symbol for DI register
 */
export const IRequestContextService = Symbol("IRequestContextService");

/**
 * Interface for handling request context operations
 */
export interface IRequestContextService {
    /**
     * Gets the current request with user information
     */
    getRequest(): RequestWithUser;

    /**
     * Gets the current user ID
     */
    getUser(): UserInfo;

    /**
     * Gets all request headers
     */
    getHeaders(): Record<string, string>;

    /**
     * Gets the current language from request
     */
    getLanguage(): string;
}