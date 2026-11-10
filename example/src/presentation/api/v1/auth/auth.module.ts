import { Module } from '@nestjs/common';
import { AuthService, AuthServiceSymbol } from '@services/auth/auth.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';

/**
 * Wires the auth controller to `AuthService`.
 *
 * Imports `UserModule` to obtain `UserServiceSymbol`, which is what
 * credential verification delegates to.
 */
@Module({
	imports: [UserModule],
	controllers: [AuthController],
	providers: [
		{
			provide: AuthServiceSymbol,
			useClass: AuthService
		}
	],
	exports: [AuthServiceSymbol]
})
export class AuthModule {}
