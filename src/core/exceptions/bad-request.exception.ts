import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseErrorCode } from '@app/interfaces/shared/errorcode/base';

export class BadRequestException extends BaseException {
  constructor(
    response: string | Record<string, any> = '',
    status: number = HttpStatus.BAD_REQUEST,
    errorCode: number = BaseErrorCode.BAD_REQUEST,
  ) {
    super(response, status, errorCode);
  }
} 