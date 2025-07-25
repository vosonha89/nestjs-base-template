import { AnyType } from './base.type';

/**
 * Normal error message
 */
export interface ErrorMessage {
    code: number;
    msg: string;
}

/**
 * Error definition for the client side
 */
export class ClientError {
    errorCode!: string;
    errorMessage!: string;
}

/**
 * Error
 */
export class AppError extends Error {
    public exception: AnyType;

    /**
     * Constructor
     * @param exception
     * @param message
     */
    constructor(exception: AnyType, message?: string) {
        super(message);
        this.exception = exception;
    }
}
