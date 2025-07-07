// helloWorld.service.spec.ts
import {Test, TestingModule} from '@nestjs/testing';
import {HelloWorldService} from './helloWorld.service';
import {IHelloWorldService, IHelloWorldServiceSymbol} from "../../interfaces/helloWorld.service.interface";
import {IRequestContextServiceSymbol} from "../../../domain/common/service/interfaces/requestContext.service.interface";
import {RequestContextService} from "../../../domain/common/service/requestContext.service";

describe('HelloWorldService', () => {
    let service: IHelloWorldService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: IRequestContextServiceSymbol,
                    useClass: RequestContextService
                },
                {
                    provide: IHelloWorldServiceSymbol,
                    useClass: HelloWorldService
                }
            ],
        }).compile();

        service = await module.resolve<HelloWorldService>(IHelloWorldServiceSymbol);
    });

    describe('validationEmail', () => {
        it('should return true for a valid email', () => {
            const email = 'test@example.com';
            expect(service.validationEmail(email)).toBe(true);
        });

        it('should return false for an email without @ symbol', () => {
            const email = 'invalid-email';
            expect(service.validationEmail(email)).toBe(false);
        });

        it('should return false for an email without domain', () => {
            const email = 'user@';
            expect(service.validationEmail(email)).toBe(false);
        });

        it('should return false for an email without username', () => {
            const email = '@example.com';
            expect(service.validationEmail(email)).toBe(false);
        });

        it('should return false for an email with spaces', () => {
            const email = 'user name@example.com';
            expect(service.validationEmail(email)).toBe(false);
        });

        it('should return false for an empty string', () => {
            const email = '';
            expect(service.validationEmail(email)).toBe(false);
        });
    });
});