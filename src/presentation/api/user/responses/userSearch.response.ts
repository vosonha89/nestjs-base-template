import { BaseListResponse } from "../../../../core/domain/common/base/base.response";
import { ApiProperty } from "@nestjs/swagger";
import { UserDto } from "../../../../core/application/dtos/user.dto";

export class UserListResponse extends BaseListResponse<UserDto> {
	@ApiProperty({ type: UserDto, isArray: true })
	public override elements: UserDto[] = [];
}
