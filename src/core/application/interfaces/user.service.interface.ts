import { IBaseDataService } from "../../domain/common/base/baseData.service.interface";
import { UserDto } from "../dtos/user.dto";

export interface IUserService extends IBaseDataService<UserDto, number> {
	validateUser(email: string, pass: string): Promise<UserDto | null>;
}
