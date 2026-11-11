import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

/**
 * CLI entry point for `npm run seed`.
 *
 * Creates a standalone application context (no HTTP server), runs the seeder
 * and always closes the context so the connection pool is released — the
 * original template left the process hanging after seeding.
 */
async function run(): Promise<void> {
	const context = await NestFactory.createApplicationContext(SeedModule, {
		logger: ['error', 'warn', 'log']
	});

	try {
		await context.get(SeedService).run();
		Logger.log('Seeding finished.', 'run-seed');
	} finally {
		await context.close();
	}
}

run().catch((error: unknown) => {
	process.stderr.write(`Seeding failed: ${String(error)}\n`);
	process.exit(1);
});
