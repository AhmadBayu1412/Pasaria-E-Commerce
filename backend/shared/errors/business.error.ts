export class BusinessError extends Error {
    public statusCode: number;
    public code?: string;

    constructor(message: string, statusCode: number = 400, code?: string){
        super(message)
        this.name = "BusinessError"
        this.statusCode = statusCode
        this.code = code
        Object.setPrototypeOf(this, BusinessError.prototype)
    }
}