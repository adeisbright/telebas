import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { ErrorInterceptor } from './error-interceptor';

describe('ErrorInterceptor', () => {
  const interceptor = new ErrorInterceptor();
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    jest.spyOn(interceptor.logger, 'error').mockImplementation(() => undefined);
  });

  it('returns a failed body for a Nest validation error', () => {
    const exception = new BadRequestException('Validation failed');

    interceptor.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      status: 'failed',
      message: 'Validation failed',
      code: undefined,
    });
  });

  it('hides the message for a coded server error', () => {
    const exception = Object.assign(new Error('database down'), {
      status: 503,
      code: 'DB_DOWN',
    });

    interceptor.catch(exception, host);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      status: 'pending',
      message: 'Oops! something went wrong',
      code: 'DB_DOWN',
    });
  });

  it('returns the original message for a coded client error', () => {
    const exception = Object.assign(new Error('plan not found'), {
      status: 404,
      code: 'PLAN_MISSING',
    });

    interceptor.catch(exception, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      status: 'failed',
      message: 'plan not found',
      code: 'PLAN_MISSING',
    });
  });

  it('falls back to 500 for an uncoded error', () => {
    const exception = new Error('boom');

    interceptor.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(exception);
  });

  it('returns the exception when the error code is the default code', () => {
    const exception = Object.assign(new Error('known'), {
      status: 400,
      code: 'WGSO00100',
    });

    interceptor.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(exception);
  });
});
