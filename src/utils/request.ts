import { getClientIp } from 'request-ip';
import { Request } from 'express';
import requestCountry from 'request-country';

export function getIp(req: Request): string {
  return getClientIp(req);
}

export function getBrowserInfo(req: Request): string {
  return req.headers['user-agent'] || 'XX';
}

export function getCountry(req: Request): string {
  return requestCountry(req, 'XX');
}
