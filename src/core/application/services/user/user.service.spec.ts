import { Test, TestingModule } from '@nestjs/testing';
import { UserService, UserServiceSymbol } from './user.service';
import { RequestContextServiceSymbol } from '../../../domain/common/service/requestContext.service';
import { UserRepositorySymbol } from '../../../../infrastructure/persistence/repositories/user.repository';
import { UserDto } from '../../dtos/user.dto';
import { UserEntity } from '../../../../infrastructure/persistence/entities/user.entity';
import { BaseFilterWhere } from '../../../domain/common/base/base.request';
import { Equal } from 'typeorm';

const mockUserRepository = {
  findById: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  existsBy: jest.fn(),
} as any;

const mockRequestContextService = {
  getContext: jest.fn(),
  setContext: jest.fn(),
  setRequest: jest.fn(),
  getRequest: jest.fn(),
  setResponse: jest.fn(),
  getResponse: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  clear: jest.fn(),
} as any;

describe('UserService', () => {
  let module: TestingModule;
  let service: UserService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: UserServiceSymbol,
          useClass: UserService,
        },
        {
          provide: RequestContextServiceSymbol,
          useValue: mockRequestContextService,
        },
        {
          provide: UserRepositorySymbol,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = await module.resolve<UserService>(UserServiceSymbol);
  });

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findById', () => {
		it('should return a user if found', async () => {
			const userEntity: UserEntity = { id: 1, email: 'test@example.com', password: 'password', createdAt: new Date(), updatedAt: new Date() };
			mockUserRepository.findById.mockResolvedValue(userEntity);

			const result = await service.findById(1);
			expect(result).toEqual(expect.objectContaining({ id: 1, email: 'test@example.com' }));
			expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
		});

		it('should return undefined if user not found', async () => {
			mockUserRepository.findById.mockResolvedValue(undefined);

			const result = await service.findById(99);
			expect(result).toBeUndefined();
			expect(mockUserRepository.findById).toHaveBeenCalledWith(99);
		});
	});

	describe('create', () => {
		it('should create and return a user', async () => {
			const newUserDto: Partial<UserDto> = { email: 'new@example.com' };
			const createdUserEntity: UserEntity = { id: 2, email: 'new@example.com', password: 'newpassword', createdAt: new Date(), updatedAt: new Date() };
			mockUserRepository.save.mockResolvedValue(createdUserEntity);

			const result = await service.create(newUserDto);
			expect(result).toEqual(expect.objectContaining({ id: 2, email: 'new@example.com' }));
			expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com' }));
		});
	});

	describe('update', () => {
		it('should update and return a user', async () => {
			const existingUserEntity: UserEntity = { id: 1, email: 'test@example.com', password: 'password', createdAt: new Date(), updatedAt: new Date() };
			const updatedUserDto: Partial<UserDto> = { email: 'updated@example.com' };
			const updatedUserEntity: UserEntity = { id: 1, email: 'updated@example.com', password: 'password', createdAt: new Date(), updatedAt: new Date() };

			mockUserRepository.findById.mockResolvedValue(existingUserEntity);
			mockUserRepository.update.mockResolvedValue(updatedUserEntity);

			const result = await service.update(1, updatedUserDto);
			expect(result).toEqual(expect.objectContaining({ id: 1, email: 'updated@example.com' }));
			expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
			expect(mockUserRepository.update).toHaveBeenCalledWith(expect.objectContaining({ id: 1, email: 'updated@example.com' }));
		});
	});

	describe('delete', () => {
		it('should delete a user and return true', async () => {
			mockUserRepository.findById.mockResolvedValue({ id: 1, createdAt: new Date(), updatedAt: new Date() } as UserEntity);
			mockUserRepository.delete.mockResolvedValue(true);

			const result = await service.delete(1);
			expect(result).toBe(true);
			expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
		});

		it('should return false if user not found for deletion', async () => {
			mockUserRepository.findById.mockResolvedValue(undefined);
			const result = await service.delete(99);
			expect(result).toBe(false);
			expect(mockUserRepository.findById).toHaveBeenCalledWith(99);
		});
	});

	describe('exists', () => {
		it('should return true if user exists', async () => {
			mockUserRepository.findById.mockResolvedValue({ id: 1, createdAt: new Date(), updatedAt: new Date() } as UserEntity);
			mockUserRepository.exists.mockResolvedValue(true);

			const result = await service.exists(1);
			expect(result).toBe(true);
			expect(mockUserRepository.exists).toHaveBeenCalledWith(1);
		});

		it('should return false if user does not exist', async () => {
			mockUserRepository.findById.mockResolvedValue(undefined);
			const result = await service.exists(99);
			expect(result).toBe(false);
			expect(mockUserRepository.findById).toHaveBeenCalledWith(99);
		});
	});

	describe('existsBy', () => {
		it('should return true if user exists by conditions', async () => {
			const filters: BaseFilterWhere[] = [{ fieldName: 'email', fieldValue: 'test@example.com' }];
			mockUserRepository.existsBy.mockResolvedValue(true);
			const expectedRepositoryCall = { email: Equal('test@example.com') };

			const result = await service.existsBy(filters);
			expect(result).toBe(true);
			expect(mockUserRepository.existsBy).toHaveBeenCalledWith(expectedRepositoryCall);
		});

		it('should return false if user does not exist by conditions', async () => {
			const filters: BaseFilterWhere[] = [{ fieldName: 'email', fieldValue: 'nonexistent@example.com' }];
			mockUserRepository.existsBy.mockResolvedValue(false);
			const expectedRepositoryCall = { email: Equal('nonexistent@example.com') };

			const result = await service.existsBy(filters);
			expect(result).toBe(false);
			expect(mockUserRepository.existsBy).toHaveBeenCalledWith(expectedRepositoryCall);
		});
	});

	describe('validateUser', () => {
		it('should return user without password on successful validation', async () => {
			const userEntity: UserEntity = { id: 1, email: 'test@example.com', password: 'password123', someOtherProp: 'value', createdAt: new Date(), updatedAt: new Date() } as UserEntity;
			mockUserRepository.find.mockResolvedValue([userEntity]);

			const result = await service.validateUser('test@example.com', 'password123');
			expect(result).toEqual(expect.objectContaining({ id: 1, email: 'test@example.com', someOtherProp: 'value' }));
			expect(mockUserRepository.find).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
		});

		it('should return null if user not found', async () => {
			mockUserRepository.find.mockResolvedValue([]);

			const result = await service.validateUser('nonexistent@example.com', 'password123');
			expect(result).toBeNull();
			expect(mockUserRepository.find).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
		});

		it('should return null if password does not match', async () => {
			const userEntity: UserEntity = { id: 1, email: 'test@example.com', password: 'password123', createdAt: new Date(), updatedAt: new Date() } as UserEntity;
			mockUserRepository.find.mockResolvedValue([userEntity]);

			const result = await service.validateUser('test@example.com', 'wrongpassword');
			expect(result).toBeNull();
			expect(mockUserRepository.find).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
		});
	});
});
