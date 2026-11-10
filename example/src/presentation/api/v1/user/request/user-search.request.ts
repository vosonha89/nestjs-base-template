import { BaseDeleteRequest, BaseSearchRequest } from '@common/base/base.request';

/**
 * Payload accepted by `DELETE /api/v1/user/:id`.
 * The identifier travels in the URL, so the body stays empty.
 */
export class UserDeleteRequest extends BaseDeleteRequest {}

/**
 * Payload accepted by `POST /api/v1/user/search`.
 *
 * The filter and sort columns accepted here are restricted by
 * `UserService.searchableFields` / `sortableFields`, so a client cannot probe
 * columns such as `password`.
 */
export class UserSearchRequest extends BaseSearchRequest {}
