import { Injectable, Scope } from "@nestjs/common";
import { IHelloWorldService } from '../../interfaces/helloWorld.service.interface';
import { BaseService } from 'src/core/domain/common/base/base.service';

/**
 * Symbol and interface definition for Hello World service
 * @namespace HelloWorldService
 */
export const HelloWorldServiceSymbol = Symbol("HelloWorldService");

/**
 * Service responsible for handling hello world functionality
 * @implements {HelloWorldServiceSymbol}
 */
@Injectable({ scope: Scope.REQUEST })
export class HelloWorldService extends BaseService implements IHelloWorldService {
  getHello(): string {
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

  /**
   * Validates if the provided string is a properly formatted email address
   * @param email - The email string to validate
   * @returns {boolean} True if email is valid, false otherwise
   */
  validationEmail(email: string): boolean {
    if (!email || email.trim() === '') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
