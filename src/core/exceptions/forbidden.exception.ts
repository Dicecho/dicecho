import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseErrorCode } from '@app/interfaces/shared/errorcode/base';

export class ForbiddenException extends BaseException {
  constructor(
    response: string | Record<string, any> = '',
    status: number = HttpStatus.FORBIDDEN,
    errorCode: number = BaseErrorCode.FORBIDDEN,
  ) {
    super(response, status, errorCode);
  }
} 