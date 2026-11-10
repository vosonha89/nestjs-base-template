import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AppError, ClientError } from './client-error';
import { AllExceptionFilter } from './all-exception.filter';
import { ILoggingService } from '../service/logging.service.interface';

describe('AllExceptionFilter', () => {
	let filter: AllExceptionFilter;
	let loggingService: jest.Mocked<ILoggingService>;
	let json: jest.Mock;
	let status: jest.Mock;
	let host: ArgumentsHost;

	beforeEach(() => {
		loggingService = {
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn()
		};

		filter = new AllExceptionFilter(loggingService);

		json = jest.fn();
		status = jest.fn(() => ({ json }));

		host = {
			switchToHttp: () => ({
				getResponse: () => ({ status }),
				getRequest: () => ({ method: 'GET', originalUrl: '/api/v1/user/1', requestId: 'rid-1' })
			})
		} as unknown as ArgumentsHost;
	});

	it('should render an AppError with its own status and payload', () => {
		const error = new AppError(HttpStatus.NOT_FOUND, new ClientError('404', 'User with id 1 was not found.'));

		filter.catch(error, host);

		expect(status).toHaveBeenCalledWith(404);
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 404,
				successful: false,
				exception: { errorCode: '404', errorMessage: 'User with id 1 was not found.' }
			})
		);
		expect(loggingService.warn).toHaveBeenCalledTimes(1);
	});

	it('should map a 401 HttpException onto the envelope', () => {
		filter.catch(new BadRequestException('nope'), host);

		expect(status).toHaveBeenCalledWith(400);
		expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: 400, successful: false }));
	});

	it('should mask an unexpected error behind a generic 500', () => {
		filter.catch(new Error('connection string leaked here'), host);

		expect(status).toHaveBeenCalledWith(500);
		const payload = json.mock.calls[0][0] as { exception: ClientError; msg: string };
		expect(payload.exception.errorCode).toEqual('500');
		expect(JSON.stringify(payload)).not.toContain('connection string leaked here');
		expect(loggingService.error).toHaveBeenCalledTimes(1);
	});

	it('should turn a unique violation into a 409 conflict', () => {
		const driverError = Object.assign(new Error('duplicate key'), { code: '23505' });
		const error = new QueryFailedError('INSERT INTO "user"', [], driverError);

		filter.catch(error, host);

		expect(status).toHaveBeenCalledWith(409);
		expect(json).toHaveBeenCalledWith(
			expect.objectContaining({ status: 409, exception: expect.objectContaining({ errorCode: '409' }) })
		);
	});

	it('should propagate the correlation id into the log line', () => {
		filter.catch(new Error('boom'), host);

		expect(loggingService.error).toHaveBeenCalledWith(
			expect.any(String),
			expect.any(Error),
			'AllExceptionFilter',
			expect.objectContaining({ requestId: 'rid-1', url: '/api/v1/user/1' })
		);
	});
});
