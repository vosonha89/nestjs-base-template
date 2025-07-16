import { BaseResponseData, BaseSearchResponse } from "../../../../core/domain/common/base/base.response";
import { ProductDto } from "../../../../core/application/dtos/product.dto";

export class ProductSearchResponse extends BaseResponseData<ProductListResponse> {
}

export class ProductListResponse extends BaseSearchResponse<ProductDto> {
}