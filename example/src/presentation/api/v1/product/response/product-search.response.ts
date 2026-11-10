import { ApiProperty } from '@nestjs/swagger';
import { BaseListResponse } from '@common/base/base.response';
import { ProductDto } from '@services/product/product.dto';

/**
 * Swagger model describing the paginated product payload.
 */
export class ProductListResponse extends BaseListResponse<ProductDto> {
	/** Page content. */
	@ApiProperty({ type: () => ProductDto, isArray: true })
	public override elements: ProductDto[] = [];
}
