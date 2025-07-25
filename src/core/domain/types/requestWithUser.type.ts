import { Request } from 'express';
import { UserInfo } from './userInfo.type';

/**
 * Request with a user
 */
export interface RequestWithUser extends Request {
    user: UserInfo;
}
