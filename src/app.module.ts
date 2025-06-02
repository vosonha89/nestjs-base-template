import { Module } from "@nestjs/common";
import { HelloWorldModule } from './presentation/api/helloWorld/helloWorld.module';

@Module({
  imports: [
    HelloWorldModule
  ],
  providers: [],
})
export class AppModule { }
