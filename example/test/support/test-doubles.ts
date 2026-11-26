import { vi } from "vitest";
import { IRequestContextService } from '@common/service/request-context.service.interface';
import { UserInfo } from '@common/type/user-info.type';

/**
 * Builds a stub {@link IRequestContextService}.
 * @param overrides - Methods to replace, e.g. `{ getUser: () => user }`
 * @returns A fully typed stub
 */
export function createRequestContextMock(overrides: Partial<IRequestContextService> = {}): IRequestContextService {
	return {
		run: vi.fn(),
		getRequest: vi.fn(() => undefined),
		getRequestId: vi.fn(() => undefined),
		getUser: vi.fn(() => undefined),
		getLanguage: vi.fn(() => 'en'),
		getHeader: vi.fn(() => undefined),
		...overrides
	};
}

/**
 * Builds a {@link UserInfo} fixture.
 * @param overrides - Fields to replace
 * @returns The fixture
 */
export function createUserInfo(overrides: Partial<UserInfo> = {}): UserInfo {
	const user = new UserInfo();
	user.id = 1;
	user.email = 'admin@demo.io';
	user.role = 'admin';
	return Object.assign(user, overrides);
}
