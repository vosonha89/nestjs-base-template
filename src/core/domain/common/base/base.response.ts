import { HttpStatus } from '@nestjs/common';
import { ClientError } from './base.exceptions';
import { GenericObject, SourceObject } from '../../types/genericObject.type';
import { ObjectHelper } from '../../helpers/objectHelper';

/**
 * Base response
 */
export abstract class BaseResponseData<T> {
    public serverDateTime!: Date;
    public status!: number;
    public msg!: string;
    public exception?: ClientError;
    public data!: T | undefined;
    public successful!: boolean;

    constructor() {
        this.serverDateTime = new Date();
        this.status = HttpStatus.BAD_REQUEST;
        this.msg = '';
        this.exception = undefined;
        this.data = undefined;
        this.successful = false;
    }
}

/**
 * Base search response
 */
export abstract class BaseSearchResponse<T> {
    public page!: number;
    public size!: number;
    public totalElements!: number;
    public totalPages!: number;
    public elements!: T[];
    public hasPrevious!: boolean;
    public hasMore!: boolean;
}

/**
 * Base item response
 */
export abstract class BaseItemResponse<T extends SourceObject> extends GenericObject<T> {
    public id = '';
    public created = new Date();
    public updated = new Date();

    public override map(object: T): void {
        ObjectHelper.map(object, this);
    }
}

/**
 * Base item admin response. Need to init all data default
 */
export abstract class BaseItemInAdminResponse<T extends SourceObject> extends BaseItemResponse<T> {
    public isDeleted = false;
}

/**
 * Normal response
 */
export class BaseResponse<T> extends BaseResponseData<T> {
    constructor(status: HttpStatus, data: T | undefined = undefined, successful = false, msg = '', exception = undefined) {
        super();
        this.status = status;
        this.msg = msg;
        this.exception = exception;
        this.data = data;
        this.successful = successful;
    }
}

/**
 * Ok response
 */
export const OKResponse = <T>(data?: T) => { return new BaseResponse<T>(HttpStatus.OK, data, true); };