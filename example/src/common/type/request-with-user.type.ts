import { Request } from 'express';
import { UserInfo } from './user-info.type';

/**
 * Express request enriched by the authentication guard and the correlation
 * id middleware.
 */
export interface RequestWithUser extends Request {
	/** Populated by `JwtAuthGuard` after a token has been verified. */
	user?: UserInfo;

	/** Correlation id reused for logging, also echoed in the response header. */
	requestId?: string;
}
