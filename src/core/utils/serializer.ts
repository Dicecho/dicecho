import { classToPlain } from 'class-transformer';
import { BaseSerializer } from '../serializers';

export function serialize<P = any, C = any>(
  MyClass: new (value: Partial<P>, context: Partial<C>) => BaseSerializer,
  value: Partial<P> | Array<Partial<P>>,
  context: Partial<C> | Array<Partial<C>> = {},
) {
  if (!Array.isArray(value)) {
    return classToPlain(new MyClass(value, Array.isArray(context) ? context[0] : context))
  }

  if (!Array.isArray(context)) {
    return value.map((v) => new MyClass(v, context)).map(v => classToPlain(v))
  }

  if (context.length !== value.length) {
    throw new Error('serializer context length not match value length')
  }

  return value.map((v, i) => new MyClass(v, context[i])).map(v => classToPlain(v))
}