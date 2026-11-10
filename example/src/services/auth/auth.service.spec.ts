import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { createRequestContextMock } from '@test/support/test-doubles';
import { AppError } from '@common/exception/client-error';
import { LoggingServiceSymbol } from '@common/service/logging.service';
import { ILoggingService } from '@common/service/logging.service.interface';
import { RequestContextServiceSymbol } from '@common/service/request-context.service';
import { UserDto } from '../user/user.dto';
import { UserServiceSymbol } from '../user/user.service';
import { IUserService } from '../user/user.service.interface';
import { AuthService } from './auth.service';

/**
 * Builds a user DTO fixture.
 * @returns The fixture
 */
function createUserDto(): UserDto {
	return Object.assign(new UserDto(), {
		id: 1,
		email: 'admin@demo.io',
		fullName: 'Demo Administrator',
		role: 'admin',
		isActive: true,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-01T00:00:00.000Z')
	});
}

describe('AuthService', () => {
	let service: AuthService;
	let userService: jest.Mocked<Pick<IUserService, 'validateUser'>>;
	let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
	let configService: { getOrThrow: jest.Mock };
	let loggingService: jest.Mocked<ILoggingService>;

	beforeEach(async () => {
		userService = { validateUser: jest.fn() };
		jwtService = { signAsync: jest.fn() };
		configService = {
			getOrThrow: jest.fn(() => ({ secret: 'a'.repeat(40), expiresIn: '1d' }))
		};
		loggingService = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn()
		};

		const moduleRef = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: RequestContextServiceSymbol, useValue: createRequestContextMock() },
				{ provide: UserServiceSymbol, useValue: userService },
				{ provide: JwtService, useValue: jwtService },
				{ provide: ConfigService, useValue: configService },
				{ provide: LoggingServiceSymbol, useValue: loggingService }
			]
		}).compile();

		service = moduleRef.get(AuthService);
	});

	describe('login', () => {
		it('should sign a token carrying the principal claims', async () => {
			userService.validateUser.mockResolvedValue(createUserDto());
			jwtService.signAsync.mockResolvedValue('signed.jwt.token');

			const result = await service.login({ email: 'admin@demo.io', password: 'Admin@12345' });

			expect(jwtService.signAsync).toHaveBeenCalledWith({
				sub: 1,
				email: 'admin@demo.io',
				role: 'admin'
			});
			expect(result.accessToken).toEqual('signed.jwt.token');
			expect(result.tokenType).toEqual('Bearer');
			expect(result.expiresIn).toEqual('1d');
			expect(result.user.email).toEqual('admin@demo.io');
		});

		it('should reject with 401 when the credentials are invalid', async () => {
			userService.validateUser.mockResolvedValue(null);

			await expect(service.login({ email: 'admin@demo.io', password: 'wrong' })).rejects.toMatchObject({
				httpStatus: 401,
				exception: { errorCode: '401', errorMessage: 'Invalid email or password.' }
			});
			expect(jwtService.signAsync).not.toHaveBeenCalled();
		});

		it('should not disclose whether the email exists', async () => {
			userService.validateUser.mockResolvedValue(null);

			const error = (await service
				.login({ email: 'ghost@demo.io', password: 'x' })
				.catch((caught: unknown) => caught)) as AppError;

			expect(error.exception.errorMessage).toEqual('Invalid email or password.');
		});
	});
});
