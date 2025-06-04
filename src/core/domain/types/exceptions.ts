import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../common/base/base.exceptions';
import { ExceptionCode } from '../common/constant/exceptionCode';

/**
 * Exception thrown when validation fails for domain entities or value objects.
 * @extends BaseException
 * 
 * @example
 * throw new ValidationException('Invalid email format');
 * throw new ValidationException('User data invalid', { field: 'email', value: 'invalid' });
 */
export class ValidationException extends BaseException {
    constructor(message: string, details?: unknown) {
        super(message, ExceptionCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, details);
    }
}

/**
 * Exception thrown when a requested resource is not found.
 * @extends BaseException
 * 
 * @example
 * throw new NotFoundException('User not found');
 * throw new NotFoundException('Post not found', { id: '123' });
 */
export class NotFoundException extends BaseException {
    constructor(message: string, details?: unknown) {
        super(message, ExceptionCode.NOT_FOUND, HttpStatus.BAD_REQUEST, details);
    }
}

/**
 * Exception thrown when authentication fails or credentials are missing.
 * @extends BaseException
 * 
 * @example
 * throw new UnauthorizedException('Invalid credentials');
 * throw new UnauthorizedException('Token expired', { token: 'expired_token' });
 */
export class UnauthorizedException extends BaseException {
    constructor(message: string, details?: unknown) {
        super(message, ExceptionCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, details);
    }
}

/**
 * Exception thrown when authenticated user lacks required permissions.
 * @extends BaseException
 * 
 * @example
 * throw new ForbiddenException('Insufficient permissions');
 * throw new ForbiddenException('Access denied', { resource: 'users', action: 'delete' });
 */
export class ForbiddenException extends BaseException {
    constructor(message: string, details?: unknown) {
        super(message, ExceptionCode.FORBIDDEN, HttpStatus.FORBIDDEN, details);
    }
}