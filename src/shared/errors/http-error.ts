export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
