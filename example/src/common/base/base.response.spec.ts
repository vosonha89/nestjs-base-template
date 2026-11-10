import { HttpStatus } from '@nestjs/common';
import { BaseListResponse, BaseResponse, CreatedResponse, OKResponse } from './base.response';
import { BaseResponseData } from './base.response';
import { ClientError } from '../exception/client-error';
import {
	BadRequest,
	Conflict,
	Forbidden,
	InternalServerError,
	NotFound,
	TooManyRequests,
	Unauthorized
} from '../exception/error-response';

describe('BaseResponse envelope', () => {
	it('should mark an OK response as successful', () => {
		const response = OKResponse({ id: 1 });

		expect(response.status).toEqual(HttpStatus.OK);
		expect(response.successful).toBe(true);
		expect(response.msg).toEqual('OK');
		expect(response.data).toEqual({ id: 1 });
		expect(response.serverDateTime).toBeInstanceOf(Date);
	});

	it('should use the 201 status for created resources', () => {
		expect(CreatedResponse({ id: 1 }).status).toEqual(HttpStatus.CREATED);
	});

	it('should default to a failed 400 without payload', () => {
		const response = new BaseResponse<null>(HttpStatus.BAD_REQUEST);

		expect(response.successful).toBe(false);
		expect(response.msg).toEqual('');
		expect(response.data).toBeUndefined();
	});
});

describe('BaseListResponse', () => {
	it('should derive the pagination flags from the total count', () => {
		const list = new BaseListResponse<string>();
		list.page = 2;
		list.size = 10;
		list.elements = ['a'];

		list.setTotalElements(35);

		expect(list.totalPages).toEqual(4);
		expect(list.hasPrevious).toBe(true);
		expect(list.hasMore).toBe(true);
	});

	it('should report no previous page on the first page', () => {
		const list = new BaseListResponse<string>();
		list.page = 1;
		list.size = 10;

		list.setTotalElements(5);

		expect(list.totalPages).toEqual(1);
		expect(list.hasPrevious).toBe(false);
		expect(list.hasMore).toBe(false);
	});

	it('should not divide by zero when the page size is zero', () => {
		const list = new BaseListResponse<string>();
		list.page = 1;
		list.size = 0;

		list.setTotalElements(10);

		expect(list.totalPages).toEqual(0);
	});
});

describe('ErrorResponse factories', () => {
	const cases: Array<[string, () => BaseResponseData<unknown>, HttpStatus, string]> = [
		['NotFound', NotFound, HttpStatus.NOT_FOUND, '404'],
		['Unauthorized', Unauthorized, HttpStatus.UNAUTHORIZED, '401'],
		['Forbidden', Forbidden, HttpStatus.FORBIDDEN, '403'],
		['Conflict', Conflict, HttpStatus.CONFLICT, '409'],
		['TooManyRequests', TooManyRequests, HttpStatus.TOO_MANY_REQUESTS, '429'],
		['BadRequest', BadRequest, HttpStatus.BAD_REQUEST, '400'],
		['InternalServerError', InternalServerError, HttpStatus.INTERNAL_SERVER_ERROR, '500']
	];

	it.each(cases)('%s should expose status %p and code %p', (_name, factory, status, code) => {
		const response = factory();

		expect(response.status).toEqual(status);
		expect(response.successful).toBe(false);
		expect(response.exception?.errorCode).toEqual(code);
		expect(response.exception?.errorMessage).toEqual(expect.any(String));
	});

	it('should accept a custom client error', () => {
		const custom = new ClientError('4008', 'Insufficient quantity.');

		expect(BadRequest(custom).exception).toBe(custom);
	});
});
