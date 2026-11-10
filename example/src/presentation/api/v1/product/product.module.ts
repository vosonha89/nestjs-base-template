import { Module } from '@nestjs/common';
import { ProductService, ProductServiceSymbol } from '@services/product/product.service';
import { ProductController } from './product.controller';

/**
 * Wires the product controller to its business service.
 */
@Module({
	controllers: [ProductController],
	providers: [
		{
			provide: ProductServiceSymbol,
			useClass: ProductService
		}
	],
	exports: [ProductServiceSymbol]
})
export class ProductModule {}
