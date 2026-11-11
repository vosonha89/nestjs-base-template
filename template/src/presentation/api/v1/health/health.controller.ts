import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@common/decorator/public.decorator';
import { HealthCheck, HealthCheckResult, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

/**
 * Liveness / readiness probe.
 *
 * Deliberately unversioned and outside the API prefix so a container runtime or
 * load balancer can reach a stable path (`/health`) that never moves.
 *
 * The payload uses the Terminus format rather than the application envelope on
 * purpose: probes expect `{ status: 'up' | 'down', info, error }`.
 *
 * `@SkipThrottle()` keeps a probe every few seconds from exhausting the shared
 * rate-limit budget — a `503 from the probe` would otherwise take the pod out
 * of the load balancer.
 */
@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
	/**
	 * Constructor
	 * @param healthCheckService - Terminus orchestrator
	 * @param dbIndicator - PostgreSQL ping indicator
	 */
	public constructor(
		private readonly healthCheckService: HealthCheckService,
		private readonly dbIndicator: TypeOrmHealthIndicator
	) {}

	/**
	 * Reports whether the process is up and the database answers.
	 * @returns `200` with `status: 'up'`, or `503` with `status: 'down'`
	 */
	@SkipThrottle()
	@Public()
	@Get()
	@HealthCheck()
	@ApiOperation({ summary: 'Liveness and readiness probe' })
	@ApiOkResponse({ description: 'Process is up and the database answers' })
	public check(): Promise<HealthCheckResult> {
		return this.healthCheckService.check([() => this.dbIndicator.pingCheck('database', { timeout: 3000 })]);
	}
}
