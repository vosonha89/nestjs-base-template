import { IBaseDataService } from "../../domain/common/base/baseData.service.interface";
import { UserDto } from "../dtos/user.dto";

export type IUserService = IBaseDataService<UserDto, number>;
