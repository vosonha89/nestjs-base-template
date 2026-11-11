import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
	it('should ping the database through Terminus', async () => {
		const result = { status: 'ok' as const };
		const dbIndicator = { pingCheck: jest.fn(() => Promise.resolve({ database: { status: 'up' as const } })) };

		// Terminus runs the indicator callbacks it is given, so the stub must too —
		// otherwise the assertion below would pass on a controller that never
		// registered an indicator at all.
		const healthCheckService = {
			check: jest.fn((indicators: Array<() => Promise<unknown>>) => {
				indicators.forEach((indicator) => void indicator());
				return Promise.resolve(result);
			})
		};

		const controller = new HealthController(
			healthCheckService as unknown as HealthCheckService,
			dbIndicator as unknown as TypeOrmHealthIndicator
		);

		await expect(controller.check()).resolves.toBe(result);

		expect(dbIndicator.pingCheck).toHaveBeenCalledWith('database', { timeout: 3000 });
		expect(healthCheckService.check).toHaveBeenCalledWith([expect.any(Function)]);
	});
});
