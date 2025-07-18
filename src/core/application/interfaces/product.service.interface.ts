import { IBaseDataService } from "../../domain/common/base/baseData.service.interface";
import { ProductDto } from "../dtos/product.dto";

export type IProductService = IBaseDataService<ProductDto, number>;
