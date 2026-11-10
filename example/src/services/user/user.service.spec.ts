import { Test } from '@nestjs/testing';
import { createRequestContextMock } from '@test/support/test-doubles';
import { AppError } from '@common/exception/client-error';
import { HashServiceSymbol } from '@common/service/bcrypt-hash.service';
import { IHashService } from '@common/service/hash.service.interface';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { UserEntity } from '@data/entity/user.entity';
import { UserRepository, UserRepositorySymbol } from '@data/repository/user.repository';
import { UserService } from './user.service';

/**
 * Builds a user entity fixture.
 * @param overrides - Fields to replace
 * @returns The fixture
 */
function createUserEntity(overrides: Partial<UserEntity> = {}): UserEntity {
	return Object.assign(new UserEntity(), {
		id: 1,
		email: 'admin@demo.io',
		password: '$2b$12$hashed',
		fullName: 'Demo Administrator',
		role: 'admin',
		isActive: true,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		...overrides
	});
}

describe('UserService', () => {
	let service: UserService;
	let userRepository: jest.Mocked<
		Pick<
			UserRepository,
			| 'findByEmail'
			| 'findById'
			| 'findOne'
			| 'find'
			| 'count'
			| 'save'
			| 'update'
			| 'delete'
			| 'exists'
			| 'existsBy'
		>
	>;
	let hashService: jest.Mocked<IHashService>;
	let loggingService: jest.Mocked<ILoggingService>;

	beforeEach(async () => {
		userRepository = {
			findByEmail: jest.fn(),
			findById: jest.fn(),
			findOne: jest.fn(),
			find: jest.fn(),
			count: jest.fn(),
			save: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			exists: jest.fn(),
			existsBy: jest.fn()
		};

		hashService = {
			hash: jest.fn(),
			compare: jest.fn()
		};

		loggingService = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn()
		};

		const moduleRef = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: RequestContextServiceSymbol, useValue: createRequestContextMock() },
				{ provide: UserRepositorySymbol, useValue: userRepository },
				{ provide: HashServiceSymbol, useValue: hashService },
				{ provide: LoggingServiceSymbol, useValue: loggingService }
			]
		}).compile();

		service = moduleRef.get(UserService);
	});

	describe('validateUser', () => {
		it('should return the DTO without the password when the credentials match', async () => {
			userRepository.findByEmail.mockResolvedValue(createUserEntity());
			hashService.compare.mockResolvedValue(true);

			const result = await service.validateUser('admin@demo.io', 'Admin@12345');

			expect(hashService.compare).toHaveBeenCalledWith('Admin@12345', '$2b$12$hashed');
			expect(result?.email).toEqual('admin@demo.io');
			expect(result?.password).toBeUndefined();
		});

		it('should return null when the password does not match', async () => {
			userRepository.findByEmail.mockResolvedValue(createUserEntity());
			hashService.compare.mockResolvedValue(false);

			await expect(service.validateUser('admin@demo.io', 'wrong')).resolves.toBeNull();
		});

		it('should return null when the user does not exist, without comparing', async () => {
			userRepository.findByEmail.mockResolvedValue(null);

			await expect(service.validateUser('ghost@demo.io', 'whatever')).resolves.toBeNull();
			expect(hashService.compare).not.toHaveBeenCalled();
		});

		it('should return null when the account is disabled', async () => {
			userRepository.findByEmail.mockResolvedValue(createUserEntity({ isActive: false }));

			await expect(service.validateUser('admin@demo.io', 'Admin@12345')).resolves.toBeNull();
			expect(hashService.compare).not.toHaveBeenCalled();
		});
	});

	describe('create', () => {
		it('should reject a missing password with error code 4001', async () => {
			await expect(service.create({ email: 'new@demo.io' })).rejects.toMatchObject({
				httpStatus: 400,
				exception: { errorCode: '4001' }
			});
			expect(userRepository.save).not.toHaveBeenCalled();
		});

		it('should hash the password before persisting it', async () => {
			hashService.hash.mockResolvedValue('$2b$12$fresh');
			userRepository.save.mockImplementation(async (entity: UserEntity) => entity);

			const result = await service.create({
				email: 'new@demo.io',
				password: 'PlainPassw0rd!',
				role: 'user'
			});

			expect(hashService.hash).toHaveBeenCalledWith('PlainPassw0rd!');
			expect(userRepository.save.mock.calls[0][0].password).toEqual('$2b$12$fresh');
			expect(result.password).toBeUndefined();
		});
	});

	describe('update', () => {
		it('should hash a new password', async () => {
			userRepository.findById.mockResolvedValue(createUserEntity());
			userRepository.update.mockImplementation(async (entity: UserEntity) => entity);
			hashService.hash.mockResolvedValue('$2b$12$rotated');

			await service.update(1, { password: 'BrandNewPass1!' });

			expect(hashService.hash).toHaveBeenCalledWith('BrandNewPass1!');
			expect(userRepository.update.mock.calls[0][0].password).toEqual('$2b$12$rotated');
		});

		it('should keep the current password when an empty string is sent', async () => {
			userRepository.findById.mockResolvedValue(createUserEntity());
			userRepository.update.mockImplementation(async (entity: UserEntity) => entity);

			await service.update(1, { password: '' });

			expect(hashService.hash).not.toHaveBeenCalled();
			expect(userRepository.update.mock.calls[0][0].password).toEqual('$2b$12$hashed');
		});

		it('should surface a 404 for an unknown identifier', async () => {
			userRepository.findById.mockResolvedValue(null);

			await expect(service.update(999, { role: 'admin' })).rejects.toBeInstanceOf(AppError);
		});
	});
});
