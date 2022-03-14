import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, Injectable } from '@nestjs/common';
import { BaseException } from './exceptions';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { Response } from 'express';
import { BaseErrorCode } from '@app/interfaces/shared/errorcode/base';

@Injectable()
@Catch()
export class APPExceptionFilter implements ExceptionFilter {
  constructor (
    @InjectSentry() private readonly sentryClient: SentryService
  ) {}
  private readonly logger = new Logger(APPExceptionFilter.name);
  
  catch(exception: BaseException | HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(exception.stack)
    this.logger.error(exception)

    if (exception instanceof BaseException) {
      return response
        .status(exception.getStatus())
        .json({
          success: false,
          code: exception.errorCode,
          detail: exception.message,
        });
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.sentryClient.instance().captureException(exception)

    response
      .status(status)
      .json({
        success: false,
        code: BaseErrorCode.UNKNOWN_ERROR,
        detail: exception.message || 'unknown error',
      });
  }
}