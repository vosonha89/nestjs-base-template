import { Module } from "@nestjs/common";
import { ProductController } from "./product.controller";
import {
	RequestContextService,
	RequestContextServiceSymbol
} from 'src/core/domain/common/service/requestContext.service';
import { ProductService, ProductServiceSymbol } from "../../../core/application/services/product/product.service";
import { DataModule } from "../../../core/domain/common/module/data.module";
import { CommonModule } from "../../../core/domain/common/module/common.module";

@Module({
	imports: [
		CommonModule,
		DataModule
	],
	controllers: [
		ProductController
	],
	providers: [
		{
			provide: RequestContextServiceSymbol,
			useClass: RequestContextService
		},
		{
			provide: ProductServiceSymbol,
			useClass: ProductService
		},
	],
})

export class ProductModule {
}
