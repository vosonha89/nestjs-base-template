import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { RequestWithUser } from 'src/core/domain/types/requestWithUser';
import { UserInfo } from 'src/core/domain/types/userInfo';
import { IRequestContextService } from '../interfaces/requestContext.interface';

/**
 * Service for handling request context information
 * Provides methods to access request-specific data such as user information, headers, and language
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService implements IRequestContextService {
    constructor(@Inject(REQUEST) private readonly request: RequestWithUser) { }

    /**
     * Gets the current request object
     */
    public getRequest(): RequestWithUser {
        return this.request;
    }

    /**
     * Set current user to context
     * @param user 
     */
    public setUser(user: UserInfo): void {
        this.request.user = user;
    }

    /**
     * Gets the current user
     */
    public getUser(): UserInfo {
        return this.request.user;
    }

    /**
     * Gets all request headers
     */
    public getHeaders(): Record<string, string> {
        return this.request.headers as Record<string, string>;
    }

    /**
     * Gets the preferred language from headers
     * Defaults to 'en' if not specified
     */
    public getLanguage(): string {
        return this.request.headers['accept-language'] ?? 'en';
    }
}
