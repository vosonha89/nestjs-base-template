import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getOptionsToken, seconds } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';

/** Quota used by this suite. Small enough to exhaust, large enough to prove a pass. */
const LIMIT = 2;

/**
 * Rate limiting (e2e).
 *
 * Proves that `ThrottlerGuard` is actually wired — the template documents a
 * `429` response and exposes `THROTTLE_TTL` / `THROTTLE_LIMIT`, so a guard that
 * is declared but never registered would be a silent hole.
 *
 * The quota is overridden through the public `getOptionsToken()` instead of
 * reading `THROTTLE_LIMIT` from the environment, so the suite does not have to
 * fire 60 requests and never depends on a local `.env` value.
 */
describe('Rate limiting (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
			.overrideProvider(getOptionsToken())
			.useValue({ throttlers: [{ ttl: seconds(60), limit: LIMIT }] })
			.compile();

		app = moduleRef.createNestApplication({ logger: false });
		configureApplication(app);
		await app.init();
	}, 60000);

	afterAll(async () => {
		if (app !== undefined) {
			await app.close();
		}
	});

	it('should answer 401 while the quota lasts, then 429 with the error envelope', async () => {
		const server = app.getHttpServer();
		const credentials = { email: 'nobody@demo.io', password: 'WrongPassw0rd' };

		for (let attempt = 0; attempt < LIMIT; attempt += 1) {
			const allowed = await request(server).post('/api/v1/auth/login').send(credentials).expect(401);

			expect(allowed.body.successful).toBe(false);
		}

		const throttled = await request(server).post('/api/v1/auth/login').send(credentials).expect(429);

		expect(throttled.body.status).toEqual(HttpStatus.TOO_MANY_REQUESTS);
		expect(throttled.body.msg).toEqual('Too many requests, please slow down.');
		expect(throttled.body.successful).toBe(false);
		expect(throttled.body.data).toBeUndefined();
		expect(throttled.body.exception).toEqual({
			errorCode: String(HttpStatus.TOO_MANY_REQUESTS),
			errorMessage: 'TooManyRequestsError'
		});
	});

	it('should never throttle the health probe', async () => {
		const server = app.getHttpServer();

		for (let attempt = 0; attempt < LIMIT + 2; attempt += 1) {
			await request(server).get('/health').expect(200);
		}
	});
});
