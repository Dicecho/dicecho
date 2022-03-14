import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../constants';
import { IUser } from '../interfaces'; 

export const UserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // const reflector = new Reflector()

    // const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    //   ctx.getHandler(),
    //   ctx.getClass(),
    // ]);

    const request = ctx.switchToHttp().getRequest();

    // if (isPublic) {
    //   return request.user as IUser | {};
    // }

    return request.user || undefined;
  },
);