import { ConfigService } from '@nestjs/config';
import { IJwtConfig } from '@config/config.type';
import { IAccessTokenPayload, JwtStrategy } from './jwt.strategy';

/**
 * Builds the strategy over a stubbed configuration.
 * @param secret - Signing secret the stub resolves
 * @returns The strategy
 */
function build(secret = 'x'.repeat(48)): JwtStrategy {
	const jwt: IJwtConfig = { secret, expiresIn: '1d' };
	const configService = { getOrThrow: jest.fn(() => jwt) };

	return new JwtStrategy(configService as unknown as ConfigService);
}

describe('JwtStrategy', () => {
	it('should read the signing secret through ConfigService', () => {
		const configService = {
			getOrThrow: jest.fn(() => ({ secret: 'y'.repeat(48), expiresIn: '1d' }))
		};

		new JwtStrategy(configService as unknown as ConfigService);

		expect(configService.getOrThrow).toHaveBeenCalledWith('jwt');
	});

	it('should map verified claims onto the authenticated principal', () => {
		const payload: IAccessTokenPayload = { sub: 42, email: 'user@example.test', role: 'admin' };

		const user = build().validate(payload);

		expect(user.id).toEqual(42);
		expect(user.email).toEqual('user@example.test');
		expect(user.role).toEqual('admin');
	});

	it('should never carry a credential into the principal', () => {
		const user = build().validate({ sub: 1, email: 'a@b.test', role: 'user' });

		expect(user).not.toHaveProperty('password');
		expect(user).not.toHaveProperty('accessToken');
	});
});
