import { Test, TestingModule } from "@nestjs/testing";
import { HelloWorldController } from "./helloWorld.controller";
import { HelloWorldModule } from './helloWorld.module';

describe("ProductController", () => {
  let helloWorldController: HelloWorldController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
          HelloWorldModule
      ]
    }).compile();

    helloWorldController = await app.resolve<HelloWorldController>(HelloWorldController);
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(helloWorldController.getHello()).toBe("Hello World!");
    });
  });
});
