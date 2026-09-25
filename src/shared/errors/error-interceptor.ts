import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

@Catch()
export class ErrorInterceptor implements ExceptionFilter {
  logger = new Logger(ErrorInterceptor.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response = ctx.getResponse();
    const exceptionMessage = exception.response
      ? exception.response.message
      : 'Oops,something went wrong';
    const exceptionStatus = exception.response
      ? exception.response.status
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || exceptionMessage;
    const status: number = exception.status || exceptionStatus;

    const exceptionErrorCode = exception.response
      ? exception.response.code
      : 'WGSO00100';

    this.logger.error({
      message: message,
      stack: exception.stack,
    });

    const errorCode: string | number | undefined =
      exception.code || exceptionErrorCode;
    const statusCode = status || 500;
    const serverErrorObject = {
      status: status >= 500 ? 'pending' : 'failed',
      message: status >= 500 ? 'Oops! something went wrong' : message,
      code: errorCode,
    };

    const errorToDisplay =
      errorCode !== 'WGSO00100' ? serverErrorObject : exception;
    response.status(statusCode).json(errorToDisplay);
  }
}
