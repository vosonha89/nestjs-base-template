// helloWorld.spec.ts
import {Test, TestingModule} from '@nestjs/testing';
import {HelloWorldService} from './helloWorld.service';
import {IHelloWorldServiceSymbol} from "../interfaces/helloWorld.service.interface";

describe('HelloWorldService', () => {
    let service: HelloWorldService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: IHelloWorldServiceSymbol,
                    useClass: HelloWorldService
                }
            ],
        }).compile();

        service = module.get<HelloWorldService>(HelloWorldService);
    });

    describe('validationEmail', () => {
        it('should return true for a valid email', () => {
            const email = 'test@example.com';
            expect(service.validationEmail(email)).toBe(true);
        });

        it('should return true for an invalid email as the method is stubbed to always return true', () => {
            const email = 'invalid-email';
            expect(service.validationEmail(email)).toBe(true);
        });
    });
});