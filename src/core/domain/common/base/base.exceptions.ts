import { ErrorResponse } from '../../types/errorResponse.type';

/**
 * Normal error message
 */
export interface ErrorMessage {
    code: number;
    msg: string;
}

/**
 * Error definition for client side
 */
export interface ClientError {
    errorCode: string;
    errorMessage: string;
}

/**
 * Error
 */
export class AppError extends Error {
    public exception: ErrorResponse;

    /**
     * Constructor
     * @param exception 
     * @param message 
     */
    constructor(exception: ErrorResponse, message?: string) {
        super(message);
        this.exception = exception;
    }
}