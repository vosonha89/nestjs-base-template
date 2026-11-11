import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestWithUser } from '../type/request-with-user.type';
import { UserInfo } from '../type/user-info.type';
import { IRequestContextService } from './request-context.service.interface';

/**
 * Service symbol for DI register
 */
export const RequestContextServiceSymbol = Symbol('RequestContextService');

/**
 * `AsyncLocalStorage` backed request context.
 *
 * A singleton (default scope) instead of `Scope.REQUEST`: consumers do not get
 * re-instantiated per request, which keeps the DI graph cheap while still
 * exposing the current request, principal and correlation id.
 */
@Injectable()
export class RequestContextService implements IRequestContextService {
	/** Per-request storage, isolated per async execution chain. */
	private readonly storage = new AsyncLocalStorage<RequestWithUser>();

	/**
	 * Runs a callback with the given request bound to the async context.
	 * @param request - Incoming HTTP request
	 * @param callback - Continuation to execute inside the context
	 * @returns Whatever the callback returns
	 */
	public run<T>(request: RequestWithUser, callback: () => T): T {
		return this.storage.run(request, callback);
	}

	/**
	 * Gets the request bound to the current async context.
	 * @returns The request, or `undefined` outside a request scope
	 */
	public getRequest(): RequestWithUser | undefined {
		return this.storage.getStore();
	}

	/**
	 * Gets the correlation id of the current request.
	 * @returns The id, or `undefined` outside a request scope
	 */
	public getRequestId(): string | undefined {
		return this.storage.getStore()?.requestId;
	}

	/**
	 * Gets the authenticated principal.
	 * @returns The user, or `undefined` when the route is public
	 */
	public getUser(): UserInfo | undefined {
		return this.storage.getStore()?.user;
	}

	/**
	 * Gets the preferred language from the `accept-language` header.
	 * @returns The language tag, `en` when absent
	 */
	public getLanguage(): string {
		const header = this.getHeader('accept-language');
		return header === undefined || header === '' ? 'en' : header;
	}

	/**
	 * Reads a single request header.
	 * @param name - Lower case header name
	 * @returns The header value, or `undefined` when absent
	 */
	public getHeader(name: string): string | undefined {
		const value = this.storage.getStore()?.headers[name];
		if (Array.isArray(value)) {
			return value[0];
		}
		return value;
	}
}
