export class ApiError extends Error {
    from?: string;
    role?: string;
    
    constructor(message: string, from?: string, role?: string){
        super(message);
        this.name = "ApiError",
        this.from = from;
        this.role = role

        Object.setPrototypeOf(this, ApiError.prototype);
    }
}



