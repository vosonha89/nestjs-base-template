/**
 * @fileoverview Type definitions for base types used in the application.
 * @module core/domain/common/base/base.type
 *
 * Type definition for representing 'any' data type.
 * This type can be used when the specific type is unknown or needs to be flexible.
 *
 * @warning Use with caution as it bypasses TypeScript's type checking.
 * Only use this type when absolutely necessary and when the type structure is truly unknown.
 * Consider using more specific types or generics where possible.
 */

// sonar-disable-next-line typescript:S1523
export type AnyType = any;

/**
 * Base object type
 */
export abstract class BaseType<IDType> {
	abstract id: IDType;
}
