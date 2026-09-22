//必要に応じて増やす
export class AppError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AppError";
    }
}