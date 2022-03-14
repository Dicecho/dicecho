import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestMethod, Logger } from '@nestjs/common';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

const RequestMethodMap = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.ALL]: 'ALL',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  data: T;
  detail?: string;
  fields?: any[];
}


@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(
    private readonly reflector: Reflector,
  ) {}
  private readonly logger = new Logger(ApiResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request: Request = context.switchToHttp().getRequest();
    const now = Date.now();
    return next
      .handle()
      .pipe(
        map(data => ({ 
          success: true,
          code: 200,
          data,
         })),
        tap(() => this.logger.log(`${request.method} ${request.url} duration: ${Date.now() - now}ms`)),
      )
  }
}