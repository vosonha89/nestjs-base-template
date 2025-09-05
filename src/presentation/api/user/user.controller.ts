import { Controller, Inject } from "@nestjs/common";
import { IRequestContextService } from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import { RequestContextServiceSymbol } from "../../../core/domain/common/service/requestContext.service";
import { UserSearchRequest } from "./requests/userSearch.request";
import { UserListResponse } from "./responses/userSearch.response";
import { ILoggingService } from "../../../core/domain/common/service/interfaces/logging.service.interface";
import { LoggingServiceSymbol } from "../../../core/domain/common/service/logging.service";
import { ApiExtraModels } from "@nestjs/swagger";
import { BaseDataController } from "../../../core/domain/common/base/base.Data.Controller";
import { UserCreateRequest } from "./requests/userCreate.request";
import { UserUpdateRequest } from "./requests/userUpdate.request";
import { UserDeleteRequest } from "./requests/userDelete.request";
import { UserDto } from "../../../core/application/dtos/user.dto";
import { IUserService } from "../../../core/application/interfaces/user.service.interface";
import { UserServiceSymbol } from "../../../core/application/services/user/user.service";

@ApiExtraModels(UserListResponse)
@Controller('user')
export class UserController extends BaseDataController<UserDto, number, UserSearchRequest, UserCreateRequest, UserUpdateRequest, UserDeleteRequest>
(
	UserDto,
	UserSearchRequest,
	UserCreateRequest,
	UserUpdateRequest,
	UserDeleteRequest
) {
	constructor(
		@Inject(LoggingServiceSymbol) public readonly loggingService: ILoggingService,
		@Inject(RequestContextServiceSymbol) public readonly context: IRequestContextService,
		@Inject(UserServiceSymbol) public readonly dataService: IUserService,
	) {
		super(loggingService, context, dataService);
	}
}
