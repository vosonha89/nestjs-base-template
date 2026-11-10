import { Inject, Injectable } from '@nestjs/common';
import { HashServiceSymbol } from '@common/service/bcrypt-hash.service';
import { IHashService } from '@common/service/hash.service.interface';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { ProductRepository, ProductRepositorySymbol } from '@data/repository/product.repository';
import { UserRepository, UserRepositorySymbol } from '@data/repository/user.repository';

/**
 * A user the seed guarantees exists.
 */
interface ISeedUser {
	readonly email: string;
	readonly password: string;
	readonly fullName: string;
	readonly role: string;
}

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
 * Populates the database with deterministic demo data.
 *
 * Idempotent by design: running it twice leaves the database unchanged, which
 * makes it safe to call from a container entrypoint or a CI job.
 */
@Injectable()
export class SeedService {
	/** Accounts created on every environment. */
	private static readonly USERS: readonly ISeedUser[] = [
		{
			email: 'admin@demo.io',
			password: 'Admin@12345',
			fullName: 'Demo Administrator',
			role: 'admin'
		},
		{
			email: 'user@demo.io',
			password: 'User@12345',
			fullName: 'Demo User',
			role: 'user'
		}
	];

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
	 * @param userRepository - Repository for user data access
	 * @param productRepository - Repository for product data access
	 * @param hashService - Service used to hash the demo passwords
	 * @param loggingService - Structured logger
	 */
	public constructor(
		@Inject(UserRepositorySymbol) private readonly userRepository: UserRepository,
		@Inject(ProductRepositorySymbol) private readonly productRepository: ProductRepository,
		@Inject(HashServiceSymbol) private readonly hashService: IHashService,
		@Inject(LoggingServiceSymbol) private readonly loggingService: ILoggingService
	) {}

	/**
	 * Seeds users and products.
	 * @returns Resolves once every record has been ensured
	 */
	public async run(): Promise<void> {
		await this.seedUsers();
		await this.seedProducts();
	}

	/**
	 * Creates the demo accounts that do not exist yet.
	 */
	private async seedUsers(): Promise<void> {
		for (const seedUser of SeedService.USERS) {
			const existing = await this.userRepository.findByEmail(seedUser.email);

			if (existing !== null) {
				this.loggingService.info(`Skip existing user ${seedUser.email}`, 'SeedService');
				continue;
			}

			const user = this.userRepository.createEntity();
			user.email = seedUser.email;
			user.fullName = seedUser.fullName;
			user.role = seedUser.role;
			user.isActive = true;
			user.password = await this.hashService.hash(seedUser.password);

			await this.userRepository.save(user);
			this.loggingService.info(`Created user ${seedUser.email} (${seedUser.role})`, 'SeedService');
		}
	}

	/**
	 * Creates the demo catalogue entries that do not exist yet.
	 */
	private async seedProducts(): Promise<void> {
		for (const seedProduct of SeedService.PRODUCTS) {
			const existing = await this.productRepository.findOne({ sku: seedProduct.sku });

			if (existing !== null) {
				this.loggingService.info(`Skip existing product ${seedProduct.sku}`, 'SeedService');
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
			this.loggingService.info(`Created product ${seedProduct.sku}`, 'SeedService');
		}
	}
}
