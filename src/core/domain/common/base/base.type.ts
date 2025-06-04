/**
 * @fileoverview Type definitions for base types used in the application.
 * @module core/domain/common/base/base.type
 *
 * @eslint-disable @typescript-eslint/no-explicit-any
 * @sonar-disable typescript:S1523
 *
 * Type definition for representing 'any' data type.
 * This type can be used when the specific type is unknown or needs to be flexible.
 * 
 * @warning Use with caution as it bypasses TypeScript's type checking. 
 * Only use this type when absolutely necessary and when the type structure is truly unknown.
 * Consider using more specific types or generics where possible.
 */
export type AnyType = any;

/**
 * Base object type
 */
export class BaseType<IDType> {
    public id!: IDType;
}