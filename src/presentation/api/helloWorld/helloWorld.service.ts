import { Injectable } from "@nestjs/common";

export interface IHelloWorldService {
  getHello(): string;
}

export const IHelloWorldService = Symbol("IHelloWorldService");

@Injectable()
export class HelloWorldService implements IHelloWorldService {
  getHello(): string {
    return "Hello World!";
  }
}
