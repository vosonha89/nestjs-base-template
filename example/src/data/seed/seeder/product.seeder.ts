import { Inject, Injectable } from '@nestjs/common';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { ProductRepository, ProductRepositorySymbol } from '../../repository/product.repository';
import { ISeeder } from '../seeder.interface';

/**
 * A product the seed guarantees exists.
 */
interface ISeedProduct {
	readonly sku: string;
	readonly name: string;
	readonly description: string;
	readonly category: string;
	readonly price: number;
	readonly stock: number;
}

/**
 * Seeds the demo catalogue.
 *
 * Idempotent by design: an existing SKU is skipped, so running it twice leaves
 * the database unchanged.
 */
@Injectable()
export class ProductSeeder implements ISeeder {
	/** Name used in log lines. */
	public readonly name = 'ProductSeeder';

	/** Catalogue created on every environment. */
	private static readonly PRODUCTS: readonly ISeedProduct[] = [
		{
			sku: 'KB-001',
			name: 'Mechanical Keyboard',
			description: 'Hot swappable, 75% layout, brown switches',
			category: 'peripherals',
			price: 129.99,
			stock: 42
		},
		{
			sku: 'MS-002',
			name: 'Wireless Mouse',
			description: 'Silent clicks, 70 day battery',
			category: 'peripherals',
			price: 59.5,
			stock: 120
		},
		{
			sku: 'MN-003',
			name: '27 inch 4K Monitor',
			description: 'IPS panel, 99% sRGB, USB-C power delivery',
			category: 'displays',
			price: 399,
			stock: 15
		},
		{
			sku: 'HD-004',
			name: 'USB-C Hub',
			description: '7 in 1, HDMI 4K60, 100W passthrough',
			category: 'peripherals',
			price: 79.99,
			stock: 0
		}
	];

	/**
	 * Constructor
	 * @param productRepository - Repository for product data access
	 * @param loggingService - Structured logger
	 */
	public constructor(
		@Inject(ProductRepositorySymbol) private readonly productRepository: ProductRepository,
		@Inject(LoggingServiceSymbol) private readonly loggingService: ILoggingService
	) {}

	/**
	 * Creates the demo catalogue entries that do not exist yet.
	 * @returns Resolves once every entry has been ensured
	 */
	public async run(): Promise<void> {
		for (const seedProduct of ProductSeeder.PRODUCTS) {
			const existing = await this.productRepository.findOne({ sku: seedProduct.sku });

			if (existing !== null) {
				this.loggingService.info(`Skip existing product ${seedProduct.sku}`, 'ProductSeeder');
				continue;
			}

			const product = this.productRepository.createEntity();
			product.sku = seedProduct.sku;
			product.name = seedProduct.name;
			product.description = seedProduct.description;
			product.category = seedProduct.category;
			product.price = seedProduct.price;
			product.stock = seedProduct.stock;
			product.isActive = true;

			await this.productRepository.save(product);
			this.loggingService.info(`Created product ${seedProduct.sku}`, 'ProductSeeder');
		}
	}
}
