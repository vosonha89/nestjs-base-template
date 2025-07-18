import { BaseResponseData, BaseListResponse } from "../../../../core/domain/common/base/base.response";
import { ProductDto } from "../../../../core/application/dtos/product.dto";
import { ApiProperty } from "@nestjs/swagger";

export class ProductListResponse extends BaseListResponse<ProductDto> {
	@ApiProperty({ type: ProductDto, isArray: true })
	public override elements: ProductDto[] = [];
}

export class ProductSearchResponse extends BaseResponseData<ProductListResponse> {
	@ApiProperty({ type: ProductListResponse })
	public override data: ProductListResponse | undefined = new ProductListResponse();
}
