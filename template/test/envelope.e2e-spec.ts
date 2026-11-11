import {
	Body,
	Controller,
	Get,
	INestApplication,
	MiddlewareConsumer,
	Module,
	NestModule,
	Post,
	RequestMethod
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getOptionsToken, seconds } from '@nestjs/throttler';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import { AppConfigModule } from '../src/config/app-config.module';
import { BaseResponse, CreatedResponse } from '../src/common/base/base.response';
import { CommonModule } from '../src/common/common.module';
import { Public } from '../src/common/decorator/public.decorator';
import { CorrelationIdMiddleware } from '../src/common/middleware/correlation-id.middleware';
import { AppValidationPipe } from '../src/common/pipe/app-validation.pipe';
import { configureApplication } from '../src/app.setup';

/**
 * Payload used to prove the validation contract.
 */
class ProbeRequest {
	/** Required so a missing value surfaces as `4001`. */
	@IsString()
	@IsNotEmpty()
	public name!: string;
}

/**
 * Throwaway HTTP surface.
 *
 * Deliberately tiny and DB-free: this suite asserts the transport contract
 * (envelope, guards, validation codes, throttling), not a feature. Keeping it
 * free of the database is what lets `npm run test:e2e` run anywhere, including
 * a bare CI container with no services.
 */
@Controller({ path: 'probe', version: '1' })
class ProbeController {
	/**
	 * Public echo endpoint.
	 * @param body - Validated payload
	 * @returns The payload wrapped in the standard envelope
	 */
	@Public()
	@Post()
	public create(
		@Body(new AppValidationPipe({ expectedType: ProbeRequest })) body: ProbeRequest
	): BaseResponse<{ name: string }> {
		return CreatedResponse({ name: body.name });
	}

	/**
	 * Protected endpoint, used to prove the global guard is wired.
	 * @returns A constant
	 */
	@Get('protected')
	public secret(): { ok: true } {
		return { ok: true };
	}

	/**
	 * Public endpoint used to assert the correlation id round-trip.
	 * @returns A constant
	 */
	@Public()
	@Get('ping')
	public ping(): { pong: true } {
		return { pong: true };
	}
}

/**
 * Wires the probe controller exactly the way `AppModule` wires the real one,
 * including the correlation id middleware — without it the `x-request-id`
 * contract would silently go untested.
 */
@Module({
	imports: [AppConfigModule, CommonModule],
	controllers: [ProbeController]
})
class ProbeModule implements NestModule {
	/**
	 * Applies the correlation id middleware to every probe route.
	 * @param consumer - Nest middleware consumer
	 */
	public configure(consumer: MiddlewareConsumer): void {
		consumer.apply(CorrelationIdMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL });
	}
}

/**
 * Every variable `validateEnvironment` requires.
 *
 * Set here rather than committed to an env file so the suite is hermetic: it
 * passes on a fresh clone and in a container with no `env/` directory.
 */
const TEST_ENV: Record<string, string> = {
	APP_NAME: 'template-e2e',
	APP_PORT: '3002',
	APP_VERSION: '1.0.0',
	API_PREFIX: 'api',
	API_DEFAULT_VERSION: '1',
	SWAGGER_ENABLED: 'false',
	SWAGGER_PATH: 'api/doc',
	DB_HOST: 'localhost',
	DB_PORT: '5432',
	DB_USERNAME: 'postgres',
	DB_PASSWORD: 'postgres',
	DB_DATABASE: 'template',
	DB_SSL: 'false',
	DB_SSL_REJECT_UNAUTHORIZED: 'true',
	DB_LOGGING: 'false',
	JWT_SECRET: 'e'.repeat(48),
	JWT_EXPIRES_IN: '1d',
	CORS_ORIGINS: '*',
	THROTTLE_TTL: '60',
	THROTTLE_LIMIT: '60'
};

/**
 * Boots the transport stack without the data module.
 * @param throttleLimit - Requests allowed per window
 * @returns The initialised application
 */
async function boot(throttleLimit?: number): Promise<INestApplication> {
	let builder = Test.createTestingModule({ imports: [ProbeModule] });

	if (throttleLimit !== undefined) {
		builder = builder
			.overrideProvider(getOptionsToken())
			.useValue({ throttlers: [{ ttl: seconds(60), limit: throttleLimit }] });
	}

	const moduleRef = await builder.compile();
	const app = moduleRef.createNestApplication({ logger: false });

	configureApplication(app);
	await app.init();

	return app;
}

describe('HTTP contract (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		Object.assign(process.env, TEST_ENV);
		app = await boot();
	}, 30000);

	afterAll(async () => {
		await app?.close();
	});

	describe('validation', () => {
		it('should answer 4001 when a required field is missing', async () => {
			const response = await request(app.getHttpServer()).post('/api/v1/probe').send({}).expect(400);

			expect(response.body.successful).toBe(false);
			expect(response.body.exception.errorCode).toEqual('4001');
			expect(response.body.data).toBeUndefined();
		});

		it('should answer a 400x code and reject unknown properties', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/v1/probe')
				.send({ name: 'ok', smuggled: 'value' })
				.expect(400);

			expect(response.body.exception.errorCode).toMatch(/^400\d$/);
		});

		it('should accept a valid payload and render the envelope', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/v1/probe')
				.send({ name: 'widget' })
				.expect(201);

			expect(response.body).toMatchObject({
				status: 201,
				successful: true,
				msg: expect.any(String),
				serverDateTime: expect.any(String),
				data: { name: 'widget' }
			});
			expect(response.body.exception).toBeUndefined();
		});
	});

	describe('authorisation', () => {
		it('should reject an anonymous request with the 401 envelope', async () => {
			const response = await request(app.getHttpServer()).get('/api/v1/probe/protected').expect(401);

			expect(response.body.successful).toBe(false);
			expect(response.body.exception.errorCode).toEqual('401');
		});

		it('should render the envelope for an unknown route', async () => {
			const response = await request(app.getHttpServer()).get('/api/v1/nope').expect(404);

			expect(response.body.successful).toBe(false);
			expect(response.body.data).toBeUndefined();
		});
	});

	describe('observability', () => {
		it('should echo a well formed inbound correlation id', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/v1/probe/ping')
				.set('x-request-id', 'e2e-correlation-1')
				.expect(200);

			expect(response.headers['x-request-id']).toEqual('e2e-correlation-1');
		});

		it('should replace an unsafe inbound correlation id', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/v1/probe/ping')
				.set('x-request-id', 'bad id with spaces')
				.expect(200);

			expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
		});
	});
});

describe('Rate limiting (e2e)', () => {
	const LIMIT = 2;
	let app: INestApplication;

	beforeAll(async () => {
		Object.assign(process.env, TEST_ENV);
		app = await boot(LIMIT);
	}, 30000);

	afterAll(async () => {
		await app?.close();
	});

	it('should allow the quota, then answer 429 with the error envelope', async () => {
		const server = app.getHttpServer();

		for (let attempt = 0; attempt < LIMIT; attempt += 1) {
			await request(server).get('/api/v1/probe/ping').expect(200);
		}

		const throttled = await request(server).get('/api/v1/probe/ping').expect(429);

		expect(throttled.body.status).toEqual(429);
		expect(throttled.body.successful).toBe(false);
		expect(throttled.body.data).toBeUndefined();
		expect(throttled.body.exception).toEqual({
			errorCode: '429',
			errorMessage: 'TooManyRequestsError'
		});
	});
});
