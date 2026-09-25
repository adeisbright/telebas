export class TimeoutError extends Error {
  constructor() {
    super('Upstream timeout');
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
