/**
 * Symbol and interface definition for Hello World service
 * @namespace HelloWorldService
 */
export const IHelloWorldServiceSymbol = Symbol("IHelloWorldService");

/**
 * Interface for the Hello World service
 * @interface IHelloWorldService
 */
export interface IHelloWorldService {
    /**
     * Gets a hello message
     * @returns {string} A greeting message
     */
    getHello(): string;

    postHello(): string;

    putHello(): string;

    deleteHello(): string;

    validationEmail(email: string): boolean;
}
