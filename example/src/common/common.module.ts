import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { IAppConfig, IJwtConfig } from '@config/config.type';
import { BcryptHashService, HashServiceSymbol } from './service/bcrypt-hash.service';
import { LoggingService, LoggingServiceSymbol } from './service/logging.service';
import { RequestContextService, RequestContextServiceSymbol } from './service/request-context.service';
import { AllExceptionFilter } from './exception/all-exception.filter';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { JwtStrategy } from './guard/jwt.strategy';
import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { ResponseTransformInterceptor } from './interceptor/response-transform.interceptor';
import { AppValidationPipe } from './pipe/app-validation.pipe';

/**
 * Cross-cutting infrastructure shared by every feature.
 *
 * Registered as `@Global()` so feature modules only declare their own
 * controller and service — no more re-registering `RequestContextService` in
 * every module (which produced several instances of the same request in the
 * original template).
 *
 * Global providers are wired here in one place:
 * - `AppValidationPipe`      — whitelisting + `GlobalError` codes
 * - `JwtAuthGuard`           — authentication, opt-out via `@Public()`
 * - `RolesGuard`             — authorisation, opt-in via `@Roles()`
 * - `ThrottlerGuard`         — rate limiting, opt-out via `@SkipThrottle()`
 * - `ResponseTransformInterceptor` — `@Expose()` rules + `undefined` -> `null`
 * - `LoggingInterceptor`     — one access log line per request
 * - `AllExceptionFilter`     — single error envelope
 */
@Global()
@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: {
				level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
				// `autoLogging: false` because `LoggingInterceptor` already writes one
				// access line per request; leaving it on would double every entry.
				autoLogging: false,
				quietReqLogger: true,
				// Credentials must never reach the log sink.
				redact: {
					paths: [
						'req.headers.authorization',
						'req.headers.cookie',
						'res.headers["set-cookie"]',
						'req.body.password',
						'*.password',
						'*.accessToken'
					],
					censor: '[REDACTED]'
				},
				customProps: () => ({ service: 'nestjs-api-template' }),
				transport:
					process.env.NODE_ENV === 'production'
						? undefined
						: { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:standard' } }
			}
		}),
		PassportModule.register({ defaultStrategy: 'jwt' }),
		ThrottlerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const app = configService.getOrThrow<IAppConfig>('app');

				return {
					throttlers: [
						{
							// `ttl` is in **milliseconds** as of @nestjs/throttler v6, while
							// `THROTTLE_TTL` is expressed in seconds. `seconds()` performs the
							// conversion, so a mistyped unit can never silently disable limiting.
							ttl: seconds(app.throttleTtl),
							limit: app.throttleLimit
						}
					]
				};
			}
		}),
		JwtModule.registerAsync({
			global: true,
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const jwt = configService.getOrThrow<IJwtConfig>('jwt');
				return {
					secret: jwt.secret,
					// `expiresIn` is validated against a `ms`-compatible pattern at boot,
					// so the assertion is safe and keeps the `ms` types out of the config layer.
					signOptions: { expiresIn: jwt.expiresIn as JwtSignOptions['expiresIn'] }
				};
			}
		})
	],
	providers: [
		{ provide: LoggingServiceSymbol, useClass: LoggingService },
		{ provide: RequestContextServiceSymbol, useClass: RequestContextService },
		{ provide: HashServiceSymbol, useClass: BcryptHashService },
		JwtStrategy,
		{ provide: APP_PIPE, useClass: AppValidationPipe },
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
		{ provide: APP_GUARD, useClass: RolesGuard },
		// Registered after the auth guards on purpose: a request rejected with
		// `401` never consumes the caller's quota, so an attacker cannot lock a
		// legitimate user out of a shared NAT IP by spamming garbage tokens.
		// Public routes (`@Public()`) still pass through `JwtAuthGuard` and are
		// therefore still throttled, which is what protects `/auth/login` from
		// credential stuffing.
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
		{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
		{ provide: APP_FILTER, useClass: AllExceptionFilter }
	],
	exports: [LoggingServiceSymbol, RequestContextServiceSymbol, HashServiceSymbol]
})
export class CommonModule {}
