import { Injectable, Scope } from "@nestjs/common";
import { IHelloWorldService } from '../interfaces/helloWorld.service.interface';

/**
 * Service responsible for handling hello world functionality
 * @implements {IHelloWorldService}
 */
@Injectable({ scope: Scope.REQUEST })
export class HelloWorldService implements IHelloWorldService {
  getHello(): string {
    return "Hello World!";
  }
}
