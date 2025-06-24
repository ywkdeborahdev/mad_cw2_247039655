class HttpResponse<T = any> {
    statusCode: number;
    message?: string;
    data?: T;

    constructor(
        statusCode: number,
        message?: string,
        data?: T
    ) {
        this.statusCode = statusCode;
        this.message = message ?? status;
        if (data !== undefined) {
            this.data = data;
        }
    }

    toJSON() {
        // Customize what gets serialized when sending response
        const json: any = { message: this.message };
        if (this.data !== undefined && this.data !== null) {
            json.data = this.data;
        }
        return json;
    }
}

export class SuccessResponse<T> extends HttpResponse<T> {
    constructor(data?: T, message?: string) {
        super(200, message ?? 'Success', data);
    }
}

export class CreatedResponse<T> extends HttpResponse<T> {
    constructor(data?: T, message?: string) {
        super(201, message, data);
    }
}

export class NoContentResponse<T> extends HttpResponse<T> {
    constructor() {
        super(204, 'No resources found', undefined);
    }
}

export class BadRequestResponse extends HttpResponse<null> {
    constructor(message?: string) {
        super(400, message, null);
    }
}

export class UnauthorizedResponse extends HttpResponse<null> {
    constructor(message?: string) {
        super(401, message ?? 'Unauthorized', null);
    }
}

export class ForbiddenResponse extends HttpResponse<null> {
    constructor(message?: string) {
        super(403, message ?? 'User not authorized for the action', null);
    }
}

export class ConflictResponse extends HttpResponse<null> {
    constructor(message?: string) {
        super(409, message, null);
    }
}

export class InternalServerErrorResponse extends HttpResponse<null> {
    constructor(error?: any) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        super(500, errorMessage, null);
    }
}


