import { HttpStatus } from '@nestjs/common';
import { ErrorMessage } from '../common/base/base.exceptions';

/**
 * Global error
 */
export class GlobalError {
    public static readonly InternalServerError = {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: 'InternalServerError'
    } as ErrorMessage;
    public static readonly BadRequestError = {
        code: HttpStatus.BAD_REQUEST,
        msg: 'BadRequestError'
    } as ErrorMessage;
    public static readonly UnauthorizedError = {
        code: HttpStatus.UNAUTHORIZED,
        msg: 'UnauthorizedError'
    } as ErrorMessage;
    public static readonly ForbiddenError = {
        code: HttpStatus.FORBIDDEN,
        msg: 'ForbiddenError'
    } as ErrorMessage;
    public static readonly NotFoundError = {
        code: HttpStatus.NOT_FOUND,
        msg: 'NotFoundError'
    } as ErrorMessage;
    public static readonly RequiredError = (fieldName: string) => {
        return {
            code: HttpStatus.BAD_REQUEST * 10 + 1,
            msg: fieldName.trim() + ' is required.'
        } as ErrorMessage;
    }
    public static readonly TypeError = (fieldName: string, fieldType: string) => {
        return {
            code: HttpStatus.BAD_REQUEST * 10 + 2,
            msg: fieldName.trim() + ' is not valid ' + fieldType + ' type.'
        } as ErrorMessage;
    }
}
