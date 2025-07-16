import validator from 'validator';
import { FilterCondition } from '../constant/filterCondition';
import { UserInfo } from '../../types/userInfo.type';
import { Inject } from '@nestjs/common';
import { IRequestContextService } from 'src/core/domain/common/service/interfaces/requestContext.service.interface';
import { ConstantValue } from '../constant/constantValue';
import { BadRequest, ErrorResponse } from '../../types/errorResponse.type';
import { GlobalError } from '../../types/globalError.type';
import { ClientError } from './base.exceptions';
import { RequestWithUser } from '../../types/requestWithUser.type';
import { RequestContextServiceSymbol } from "../service/requestContext.service";

/**
 * Base filter
 */
export interface BaseFilter {
    fieldName: string;
    fieldValue: string;
    filterCondition: FilterCondition;
}

/**
 * Base sort
 */
export interface BaseSort {
    sortField: string;
    sortType: 'DESC' | 'ASC';
}

/**
 * Base request from the client side
 */
export abstract class BaseRequest {
    public currentError?: ErrorResponse;

    /**
     * Map request from the client side
     * @param req
     */
    public abstract mapRequest(req: RequestWithUser): void;

    /**
     * Check request is valid
     */
    public abstract isValid(): boolean;
}

/**
 * Base authorized request from the client side
 */
export abstract class BaseAuthorizedRequest extends BaseRequest {
    public currentUser: UserInfo;

    /**
     * Constructor with authorized user
     * @param requestContextService
     */
    constructor(
        @Inject(RequestContextServiceSymbol) protected readonly requestContextService: IRequestContextService
    ) {
        super();
        this.currentUser = requestContextService.getUser(); // get current user logged in
    }
}

/**
 * Base search request
 */
export abstract class BaseSearchRequest extends BaseAuthorizedRequest {
    public page!: number;
    public size!: number;
    public filters!: BaseFilter[];
    public sort!: BaseSort;

    /**
     * Constructor
     */
    constructor(
        @Inject(RequestContextServiceSymbol) protected readonly requestContextService: IRequestContextService) {
        super(requestContextService);
        this.page = ConstantValue.PAGE_INDEX;
        this.size = ConstantValue.PAGE_SIZE;
        this.filters = [];
        this.sort = {
            sortField: 'created',
            sortType: 'DESC'
        };
        this.mapRequest(requestContextService.getRequest());
    }

    /**
     * Map request from the client side
     * @param req
     */
    public mapRequest(req: RequestWithUser): void {
        const me = this;
        if (req.body.page) {
            me.page = req.body.page;
        }
        if (req.body.size) {
            me.size = req.body.size;
        }
        if (req.body.filters) {
            me.filters = req.body.filters;
        }
        if (req.body.sort) {
            me.sort = req.body.sort;
        }
    }

    public isValid(): boolean {
        const me = this;
        if (!me.page) {
            const error = GlobalError.RequiredError('Page');
            me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
            return false;
        } else if (!validator.isNumeric(me.page.toString())) {
            const error = GlobalError.TypeError('Page', 'number');
            me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
            return false;
        }
        if (!me.size) {
            const error = GlobalError.RequiredError('Size');
            me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
            return false;
        } else if (!validator.isNumeric(me.size.toString())) {
            const error = GlobalError.TypeError('Size', 'number');
            me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
            return false;
        }
        return true;
    }
}

/**
 * Base get by id request
 */
export abstract class BaseGetById extends BaseAuthorizedRequest {
    public id!: string;

    /**
     * Constructor
     */
    constructor(
        @Inject(RequestContextServiceSymbol) protected readonly requestContextService: IRequestContextService
    ) {
        super(requestContextService);
        this.mapRequest(requestContextService.getRequest());
    }

    public mapRequest(req: RequestWithUser): void {
        const me = this;
        if (req.query.id) {
            me.id = req.query.id as string;
        }
    }

    public isValid(): boolean {
        const me = this;
        if (!me.id) {
            const error = GlobalError.RequiredError('Id');
            me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
            return false;
        }
        return true;
    }
}

/**
 * Base create request
 */
export abstract class BaseCreateRequest extends BaseAuthorizedRequest {
    /**
     * Constructor
     */
    constructor(
        @Inject(RequestContextServiceSymbol) protected readonly requestContextService: IRequestContextService) {
        super(requestContextService);
        this.mapRequest(requestContextService.getRequest());
    }
}

/**
 * Base edit request
 */
export abstract class BaseUpdateRequest extends BaseAuthorizedRequest {
    public id!: string;

    /**
     * Constructor
     */
    constructor(
        @Inject(RequestContextServiceSymbol) protected readonly requestContextService: IRequestContextService) {
        super(requestContextService);
        this.mapRequest(requestContextService.getRequest());
    }

    public mapRequest(req: RequestWithUser): void {
        const me = this;
        if (req.query.id) {
            me.id = req.query.id as string;
        }
    }

    public isValid(): boolean {
        const me = this;
        if (!me.id) {
            const error = GlobalError.RequiredError('Id');
            me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
            return false;
        }
        return true;
    }
}

/**
 * Base delete request
 */
export abstract class BaseDeleteRequest extends BaseAuthorizedRequest {
    public id!: string;
    public readonly softDelete = true;

    /**
     * Constructor
     */
    constructor(
        @Inject(RequestContextServiceSymbol) protected readonly requestContextService: IRequestContextService) {
        super(requestContextService);
        this.mapRequest(requestContextService.getRequest());
    }

    public mapRequest(req: RequestWithUser): void {
        const me = this;
        if (req.query.id) {
            me.id = req.query.id as string;
        }
    }

    public isValid(): boolean {
        const me = this;
        if (!me.id) {
            const error = GlobalError.RequiredError('Id');
            me.currentError = BadRequest({ errorCode: error.code.toString(), errorMessage: error.msg } as ClientError);
            return false;
        }
        return true;
    }
}