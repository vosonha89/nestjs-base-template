import { Controller, Inject } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { BaseDataController } from '@common/base/base-data.controller';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { IRequestContextService } from '@common/service/request-context.service.interface';
import { UserDto } from '@services/user/user.dto';
import { UserServiceSymbol } from '@services/user/user.service';
import { IUserService } from '@services/user/user.service.interface';
import { UserCreateRequest } from './request/user-create.request';
import { UserDeleteRequest, UserSearchRequest } from './request/user-search.request';
import { UserUpdateRequest } from './request/user-update.request';
import { UserListResponse } from './response/user-search.response';

/**
 * HTTP surface of the user feature.
 *
 * All CRUD behaviour comes from {@link BaseDataController}; this class only
 * supplies the DTO/request classes and the service binding, so it stays free of
 * business logic.
 */
@ApiTags('user')
@ApiExtraModels(UserListResponse)
@Controller({ path: 'user', version: '1' })
export class UserController extends BaseDataController<
	UserDto,
	number,
	UserSearchRequest,
	UserCreateRequest,
	UserUpdateRequest,
	UserDeleteRequest
>(UserDto, UserSearchRequest, UserCreateRequest, UserUpdateRequest, UserDeleteRequest) {
	/**
	 * Constructor
	 * @param loggingService - Structured logger
	 * @param context - Request scoped data
	 * @param dataService - Business service backing this controller
	 */
	public constructor(
		@Inject(LoggingServiceSymbol) loggingService: ILoggingService,
		@Inject(RequestContextServiceSymbol) context: IRequestContextService,
		@Inject(UserServiceSymbol) dataService: IUserService
	) {
		super(loggingService, context, dataService);
	}
}
