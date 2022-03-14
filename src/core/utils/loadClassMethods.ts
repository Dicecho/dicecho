import { Document, Schema } from 'mongoose';
import { BaseDocument } from '@app/core';

export const loadClassMethods = (doc: typeof BaseDocument, schema: Schema ) => {
  Object.getOwnPropertyNames(doc.prototype).forEach(function(name) {
    if (name.match(/^(constructor)$/)) {
      return;
    }
  
    const method = Object.getOwnPropertyDescriptor(doc.prototype, name);
    schema.method(name, method.value)
  });
}