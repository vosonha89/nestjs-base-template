 
import { AnyType } from '../common/base/base.type';

/**
 * Dynamic SourceObject
 */
export class SourceObject {
    [key: string]: AnyType;
}

/**
 * Generic object type. All properties need to assign value to use map dynamic
 */
export abstract class GenericObject<T extends SourceObject> {
    [key: string]: AnyType;

    public map(object: T): void {
        const keys = Object.getOwnPropertyNames(this);
        for (const key of keys) {
            if (object[key])
            {
                this[key] = JSON.parse(JSON.stringify(object[key]));
            }
        }
    }
}