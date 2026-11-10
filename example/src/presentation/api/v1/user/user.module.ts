import { Module } from '@nestjs/common';
import { UserService, UserServiceSymbol } from '@services/user/user.service';
import { UserController } from './user.controller';

/**
 * Wires the user controller to its business service.
 *
 * `CommonModule` and `DataModule` are global, so no extra imports are needed —
 * unlike the original template, which re-registered `RequestContextService`
 * here and created a second instance of the same request context.
 */
@Module({
	controllers: [UserController],
	providers: [
		{
			provide: UserServiceSymbol,
			useClass: UserService
		}
	],
	exports: [UserServiceSymbol]
})
export class UserModule {}
