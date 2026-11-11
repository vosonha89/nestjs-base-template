import { RequestWithUser } from '../type/request-with-user.type';
import { UserInfo } from '../type/user-info.type';

/**
 * Request scoped data accessible from anywhere in the call stack without
 * threading the `Request` object through every layer.
 *
 * Backed by `AsyncLocalStorage`, so the service itself is a singleton and does
 * not force request scoping on its consumers.
 */
export interface IRequestContextService {
	/**
	 * Runs a callback with the given request bound to the async context.
	 * Called once per request by `CorrelationIdMiddleware`.
	 * @param request - Incoming HTTP request
	 * @param callback - Continuation to execute inside the context
	 * @returns Whatever the callback returns
	 */
	run<T>(request: RequestWithUser, callback: () => T): T;

	/**
	 * Gets the request bound to the current async context.
	 * @returns The request, or `undefined` outside a request scope
	 */
	getRequest(): RequestWithUser | undefined;

	/**
	 * Gets the correlation id of the current request.
	 * @returns The id, or `undefined` outside a request scope
	 */
	getRequestId(): string | undefined;

	/**
	 * Gets the authenticated principal.
	 * @returns The user, or `undefined` when the route is public
	 */
	getUser(): UserInfo | undefined;

	/**
	 * Gets the preferred language from the `accept-language` header.
	 * @returns The language tag, `en` when absent
	 */
	getLanguage(): string;

	/**
	 * Reads a single request header.
	 * @param name - Lower case header name
	 * @returns The header value, or `undefined` when absent
	 */
	getHeader(name: string): string | undefined;
}
