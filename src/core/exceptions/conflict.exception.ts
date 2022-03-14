import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseErrorCode } from '@app/interfaces/shared/errorcode/base';

export class ConflictException extends BaseException {
  constructor(
    response: string | Record<string, any> = '',
    status: number = HttpStatus.CONFLICT,
    errorCode: number = BaseErrorCode.CONFLICT,
  ) {
    super(response, status, errorCode);
  }
} 