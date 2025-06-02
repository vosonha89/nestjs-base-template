import { Test, TestingModule } from "@nestjs/testing";
import { HelloWorldController } from "./helloWorld.controller";
import { HelloWorldModule } from './helloWorld.module';

describe("HelloWorldController", () => {
  let helloWorldController: HelloWorldController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [HelloWorldModule]
    }).compile();

    helloWorldController = app.get<HelloWorldController>(HelloWorldController);
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(helloWorldController.getHello()).toBe("Hello World!");
    });
  });
});
