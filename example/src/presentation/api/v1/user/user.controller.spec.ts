import { HttpStatus } from '@nestjs/common';
import { createRequestContextMock } from '@test/support/test-doubles';
import { AppError } from '@common/exception/client-error';
import { ILoggingService } from '@common/service/logging.service.interface';
import { UserSearchRequest } from './request/user-search.request';
import { UserCreateRequest } from './request/user-create.request';
import { UserUpdateRequest } from './request/user-update.request';
import { UserController } from './user.controller';
import { UserDto } from '@services/user/user.dto';
import { IUserService } from '@services/user/user.service.interface';

/**
 * Builds a user DTO fixture.
 * @returns The fixture
 */
function createUserDto(): UserDto {
	return Object.assign(new UserDto(), {
		id: 1,
		email: 'admin@demo.io',
		role: 'admin',
		isActive: true,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z')
	});
}

describe('BaseDataController (via UserController)', () => {
	let controller: UserController;
	let dataService: jest.Mocked<IUserService>;
	let loggingService: jest.Mocked<ILoggingService>;

	beforeEach(() => {
		dataService = {
			findById: jest.fn(),
			findBy: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			exists: jest.fn(),
			existsBy: jest.fn(),
			validateUser: jest.fn()
		};

		loggingService = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn()
		};

		controller = new UserController(loggingService, createRequestContextMock(), dataService);
	});

	describe('search', () => {
		/** Builds a search request. */
		const searchRequest = (count: boolean): UserSearchRequest =>
			Object.assign(new UserSearchRequest(), { page: 2, size: 5, count });

		it('should translate the page into skip/take and fill the page metadata', async () => {
			dataService.findBy.mockResolvedValue({ elements: [createUserDto()], totalRecord: 0 });

			const response = await controller.search(searchRequest(false));

			expect(dataService.findBy).toHaveBeenCalledWith([], undefined, 5, 5, false);
			expect(response.status).toEqual(HttpStatus.OK);
			expect(response.data?.page).toEqual(2);
			expect(response.data?.size).toEqual(5);
			expect(response.data?.elements).toHaveLength(1);
			expect(response.data?.hasPrevious).toBe(true);
		});

		it('should populate the totals only when count is requested', async () => {
			dataService.findBy.mockResolvedValue({ elements: [], totalRecord: 12 });

			const response = await controller.search(searchRequest(true));

			expect(response.data?.totalElements).toEqual(12);
			expect(response.data?.totalPages).toEqual(3);
		});

		it('should report hasMore when a full page was returned', async () => {
			dataService.findBy.mockResolvedValue({
				elements: [createUserDto(), createUserDto(), createUserDto(), createUserDto(), createUserDto()],
				totalRecord: 0
			});

			const response = await controller.search(searchRequest(false));

			expect(response.data?.hasMore).toBe(true);
		});
	});

	describe('create', () => {
		it('should return a 201 envelope', async () => {
			dataService.create.mockResolvedValue(createUserDto());

			const request = Object.assign(new UserCreateRequest(), {
				email: 'admin@demo.io',
				password: 'Admin@12345'
			});
			const response = await controller.create(request);

			expect(response.status).toEqual(HttpStatus.CREATED);
			expect(response.data?.email).toEqual('admin@demo.io');
		});
	});

	describe('findOne', () => {
		it('should return the record', async () => {
			dataService.findById.mockResolvedValue(createUserDto());

			const response = await controller.findOne(1);

			expect(response.data?.id).toEqual(1);
		});

		it('should throw a 404 when the record is missing', async () => {
			dataService.findById.mockResolvedValue(undefined);

			await expect(controller.findOne(404)).rejects.toBeInstanceOf(AppError);
		});
	});

	describe('update', () => {
		it('should delegate to the service and wrap the result', async () => {
			dataService.update.mockResolvedValue(createUserDto());

			const response = await controller.update(1, Object.assign(new UserUpdateRequest(), { role: 'admin' }));

			expect(dataService.update).toHaveBeenCalledTimes(1);
			expect(response.data?.id).toEqual(1);
		});
	});

	describe('delete', () => {
		it('should return true when the record was removed', async () => {
			dataService.delete.mockResolvedValue(true);

			const response = await controller.delete(1);

			expect(response.data).toBe(true);
		});

		it('should throw a 404 when nothing was removed', async () => {
			dataService.delete.mockResolvedValue(false);

			await expect(controller.delete(404)).rejects.toBeInstanceOf(AppError);
		});
	});
});
