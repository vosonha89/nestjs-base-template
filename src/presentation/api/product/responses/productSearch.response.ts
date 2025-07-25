import { BaseListResponse } from "../../../../core/domain/common/base/base.response";
import { ProductDto } from "../../../../core/application/dtos/product.dto";
import { ApiProperty } from "@nestjs/swagger";

export class ProductListResponse extends BaseListResponse<ProductDto> {
	@ApiProperty({ type: ProductDto, isArray: true })
	public override elements: ProductDto[] = [];
}
