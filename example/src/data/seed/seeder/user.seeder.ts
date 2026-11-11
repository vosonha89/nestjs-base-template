import { Inject, Injectable } from '@nestjs/common';
import { HashServiceSymbol } from '@common/service/bcrypt-hash.service';
import { IHashService } from '@common/service/hash.service.interface';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { UserRepository, UserRepositorySymbol } from '../../repository/user.repository';
import { ISeeder } from '../seeder.interface';

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
 * Seeds the demo accounts.
 *
 * Idempotent by design: an existing email is skipped, so running it twice
 * leaves the database unchanged.
 */
@Injectable()
export class UserSeeder implements ISeeder {
	/** Name used in log lines. */
	public readonly name = 'UserSeeder';

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

	/**
	 * Constructor
	 * @param userRepository - Repository for user data access
	 * @param hashService - Service used to hash the demo passwords
	 * @param loggingService - Structured logger
	 */
	public constructor(
		@Inject(UserRepositorySymbol) private readonly userRepository: UserRepository,
		@Inject(HashServiceSymbol) private readonly hashService: IHashService,
		@Inject(LoggingServiceSymbol) private readonly loggingService: ILoggingService
	) {}

	/**
	 * Creates the demo accounts that do not exist yet.
	 * @returns Resolves once every account has been ensured
	 */
	public async run(): Promise<void> {
		for (const seedUser of UserSeeder.USERS) {
			const existing = await this.userRepository.findByEmail(seedUser.email);

			if (existing !== null) {
				this.loggingService.info(`Skip existing user ${seedUser.email}`, 'UserSeeder');
				continue;
			}

			const user = this.userRepository.createEntity();
			user.email = seedUser.email;
			user.fullName = seedUser.fullName;
			user.role = seedUser.role;
			user.isActive = true;
			user.password = await this.hashService.hash(seedUser.password);

			await this.userRepository.save(user);
			this.loggingService.info(`Created user ${seedUser.email} (${seedUser.role})`, 'UserSeeder');
		}
	}
}
