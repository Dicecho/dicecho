import { Exclude, classToPlain } from 'class-transformer';

export class BaseSerializer<T=any, C=any> {
  @Exclude()
  _obj: Partial<T> = { };

  @Exclude()
  _context: Partial<C> = { };

  constructor(
    partial: Partial<T>,
    context: Partial<C> = { },
  ) {
    this._obj = partial;
    this._context = context;
  }

  assignObject(partial: Partial<T>) {
    for (const key in partial) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = partial[key];
      }
    }
  }
}