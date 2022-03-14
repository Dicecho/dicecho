export const configKeys = {
  BOOTH_REFRESH_TOKEN: 'booth_refresh_token',
  BOOTH_REFRESH_TOKEN_VALID: 'booth_refresh_token_valid',
  BANNER: 'banner',
  EVENT: 'event',
};

export interface EventData {
  priority: number,
  imageUrl: string,
  action: string,
  page: string,
  startAt: Date,
  endAt: Date,
}

export const DEFAULT_COVER_URL = 'https://file.dicecho.com/images/95AB141E8F2D6985E038CB3D97DB2BBF.png';
export const DEFAULT_ACCOUNT_BACKGROUND = 'https://file.dicecho.com/mod/600af94a44f096001d6e49df/2021032019361575.png';
export const DEFAULT_BANNER = {
  priority: 0,
  action: '',
  imageUrl: 'https://file.dicecho.com/mod/600af94a44f096001d6e49df/2021033103382254.png',
  link: '',
};