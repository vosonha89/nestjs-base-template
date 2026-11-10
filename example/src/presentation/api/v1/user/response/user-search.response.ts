import { ApiProperty } from '@nestjs/swagger';
import { BaseListResponse } from '@common/base/base.response';
import { UserDto } from '@services/user/user.dto';

/**
 * Swagger model describing the paginated user payload.
 */
export class UserListResponse extends BaseListResponse<UserDto> {
	/** Page content. */
	@ApiProperty({ type: () => UserDto, isArray: true })
	public override elements: UserDto[] = [];
}
