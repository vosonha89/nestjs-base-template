import { Injectable, Scope } from "@nestjs/common";
import { IHelloWorldService } from '../interfaces/helloWorld.service.interface';
import { BaseService } from 'src/core/domain/common/base/base.service';

/**
 * Service responsible for handling hello world functionality
 * @implements {IHelloWorldService}
 */
@Injectable({ scope: Scope.REQUEST })
export class HelloWorldService extends BaseService implements IHelloWorldService {
  getHello(): string {
    console.log(this.context.getRequest());
    return "Hello World!";
  }

  postHello(): string {
    return "POST Hello World";
  }

  putHello(): string {
    return "PUT Hello World";
  }

  deleteHello(): string {
    return "DELETE Hello World";
  }
}
