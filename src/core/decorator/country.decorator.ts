import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { getCountry, getIp, getBrowserInfo } from '../utils';
import requestCountry from 'request-country';

export const CountryDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // const reflector = new Reflector()

    // const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    //   ctx.getHandler(),
    //   ctx.getClass(),
    // ]);

    const request = ctx.switchToHttp().getRequest<Request>();
    const clientCountry = requestCountry(request, 'XX');

    return clientCountry
  },
);