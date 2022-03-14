// import { getClientIp } from 'request-ip';

// export function getIp(req: Request): string {
//   return getClientIp(req);
// }

// export function getBrowserInfo(req: Request): string {
//   return req.header['user-agent'] || 'XX';
// }

// export function getCountry(req: Request): string {
//   return req.header['cf-ipcountry'] ? req.header['cf-ipcountry'] : 'XX';
// }

export * from './mongo';
export * from './wilson';
export * from './cryptogram';
export * from './exception';
export * from './interceptor';
export * from './request';
export * from './utils';
export * from './hashtag';
export * from './date';
export * from './difference';
