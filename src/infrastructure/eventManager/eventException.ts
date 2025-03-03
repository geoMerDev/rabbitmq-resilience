export class EventException extends Error {
    exceptionType: string;
    stackTrace: string;
    failedAt: Date;
    additionalData: Record<string, any>;

    constructor(message: string, exceptionType: string, additionalData: Record<string, any> = {}) {
        super(message);
        this.exceptionType = exceptionType;
        this.stackTrace = this.stack ?? '';
        this.failedAt = new Date();
        this.additionalData = additionalData;
    }

    get exceptionDetail() {
        return {
            message: this.message,
            exception_type: this.exceptionType,
            stack_trace: this.stackTrace,
            failed_at: this.failedAt.toString(),
            additional_data: this.additionalData
        };
    }

    static badRequest(message: string, additionalData: Record<string, any> = {}) {
        return new EventException(message, 'BadRequest', additionalData);
    }

    static unauthorized(message: string, additionalData: Record<string, any> = {}) {
        return new EventException(message, 'Unauthorized', additionalData);
    }

    static forbidden(message: string, additionalData: Record<string, any> = {}) {
        return new EventException(message, 'Forbidden', additionalData);
    }

    static notFound(message: string, additionalData: Record<string, any> = {}) {
        return new EventException(message, 'NotFound', additionalData);
    }

    static internalServer(message: string = 'Internal error', additionalData: Record<string, any> = {}) {
        return new EventException(message, 'InternalServer', additionalData);
    }

    static transactionError(reason: string, additionalData: Record<string, any> = {}) {
        return new EventException(`Transaction failed: ${reason}`, 'TransactionError', additionalData);
    }

    static missingAttribute(attribute: string, from: string, additionalData: Record<string, any> = {}) {
        return new EventException(`Missing attribute: ${attribute} from ${from}`, 'MissingAttribute', additionalData);
    }

    static actionNotAllowed(message: string, additionalData: Record<string, any> = {}) {
        return new EventException(message, 'ActionNotAllowed', additionalData);
    }
}
