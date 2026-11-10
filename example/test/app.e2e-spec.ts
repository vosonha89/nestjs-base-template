import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';

/**
 * End-to-end suite.
 *
 * Boots the real `AppModule` through {@link configureApplication}, so the
 * global prefix, URI versioning, guards, interceptors, pipes and the exception
 * filter are all exercised exactly as in production.
 *
 * Requires a reachable database configured in `env/.env.development`
 * (`docker compose up -d` provides one).
 */
describe('API (e2e)', () => {
	let app: INestApplication;
	let accessToken: string;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

		app = moduleRef.createNestApplication({ logger: false });
		configureApplication(app);
		await app.init();

		const login = await request(app.getHttpServer())
			.post('/api/v1/auth/login')
			.send({ email: 'admin@demo.io', password: 'Admin@12345' });

		accessToken = login.body.data.accessToken as string;
	}, 60000);

	afterAll(async () => {
		if (app !== undefined) {
			await app.close();
		}
	});

	describe('health', () => {
		it('GET /health should report the database as up without a token', async () => {
			const response = await request(app.getHttpServer()).get('/health').expect(200);

			expect(response.body.status).toEqual('ok');
		});
	});

	describe('auth', () => {
		it('should issue a token for valid credentials', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/v1/auth/login')
				.send({ email: 'admin@demo.io', password: 'Admin@12345' })
				.expect(200);

			expect(response.body.successful).toBe(true);
			expect(response.body.data.accessToken).toEqual(expect.any(String));
			expect(response.body.data.user.password).toBeUndefined();
		});

		it('should reject invalid credentials with 401 and the envelope', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/v1/auth/login')
				.send({ email: 'admin@demo.io', password: 'definitely-wrong' })
				.expect(401);

			expect(response.body.successful).toBe(false);
			expect(response.body.exception.errorCode).toEqual('401');
		});

		it('should reject a malformed payload with a 400x validation code', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/v1/auth/login')
				.send({ email: 'not-an-email' })
				.expect(400);

			expect(response.body.exception.errorCode).toMatch(/^400\d$/);
		});
	});

	describe('authorisation', () => {
		it('should reject an anonymous request with 401', async () => {
			await request(app.getHttpServer()).get('/api/v1/user/1').expect(401);
		});

		it('should serve the resource with a valid token, without the password column', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/v1/user/1')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(200);

			expect(response.body.data.email).toEqual('admin@demo.io');
			expect(response.body.data.password).toBeUndefined();
		});

		it('should echo a supplied correlation id', async () => {
			const response = await request(app.getHttpServer())
				.get('/health')
				.set('x-request-id', 'e2e-correlation-1')
				.expect(200);

			expect(response.headers['x-request-id']).toEqual('e2e-correlation-1');
		});
	});

	describe('search', () => {
		it('should paginate the user list', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/v1/user/search')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ page: 1, size: 10, count: true })
				.expect(200);

			expect(response.body.data.page).toEqual(1);
			expect(response.body.data.size).toEqual(10);
			expect(Array.isArray(response.body.data.elements)).toBe(true);
		});

		it('should refuse a filter on a non searchable column with 4007', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/v1/user/search')
				.set('Authorization', `Bearer ${accessToken}`)
				.send({
					page: 1,
					size: 10,
					filters: [{ fieldName: 'password', fieldValue: 'x', filterCondition: '~' }]
				})
				.expect(400);

			expect(response.body.exception.errorCode).toEqual('4007');
		});
	});

	describe('not found', () => {
		it('should render the envelope for an unknown route', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/v1/nope')
				.set('Authorization', `Bearer ${accessToken}`)
				.expect(404);

			expect(response.body.successful).toBe(false);
		});
	});
});
