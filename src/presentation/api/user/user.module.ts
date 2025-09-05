import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import {
	RequestContextService,
	RequestContextServiceSymbol
} from 'src/core/domain/common/service/requestContext.service';
import { DataModule } from "../../../core/domain/common/module/data.module";
import { CommonModule } from "../../../core/domain/common/module/common.module";
import { UserService, UserServiceSymbol } from "../../../core/application/services/user/user.service";

@Module({
	imports: [
		CommonModule,
		DataModule
	],
	controllers: [
		UserController
	],
	providers: [
		{
			provide: RequestContextServiceSymbol,
			useClass: RequestContextService
		},
		{
			provide: UserServiceSymbol,
			useClass: UserService,
		},
	],
})

export class UserModule {
}
