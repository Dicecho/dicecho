import { HttpException } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(response: string | Record<string, any>, status: number, errorCode: number) {
    super(response, status);
    this.errorCode = errorCode;
  }

  public errorCode: number;
}