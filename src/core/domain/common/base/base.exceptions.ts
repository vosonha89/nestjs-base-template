export class BaseException extends Error {
    constructor(
        public readonly message: string,
        public readonly code: string,
        public readonly statusCode: number = 500,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    public toJSON() {
        const jsonObject = {
            error: {
                code: this.code,
                message: this.message,
                detail: this.details
            },
            statusCode: this.statusCode,
        };
        return jsonObject;
    }
}