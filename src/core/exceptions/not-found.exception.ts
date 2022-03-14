import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseErrorCode } from '@app/interfaces/shared/errorcode/base';

export class NotFoundException extends BaseException {
  constructor(
    response: string | Record<string, any> = '',
    status: number = HttpStatus.NOT_FOUND,
    errorCode: number = BaseErrorCode.NOT_FOUND,
  ) {
    super(response, status, errorCode);
  }
} 