
import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@app/auth/decorators/public.decorator';
import { BaseException } from '@app/core';
import { AuthErrorCode } from '@app/interfaces/shared/errorcode/auth';

@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  handleRequest<UserDocument>(err: any, user: UserDocument, info: any, context: any, status: any) {

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  
    if ((err || !user) && !isPublic) {
      throw new BaseException('请登录后再次尝试，如果您已登录请尝试刷新', HttpStatus.UNAUTHORIZED, AuthErrorCode.ACCESS_TOKEN_EXPIRED);
    }
    return user;
  }

  // canActivate(context: ExecutionContext) {
  //   return super.canActivate(context);
  // }
}
