import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ObjectId } from 'mongodb';

export function IsObjectId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsObjectId',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return ObjectId.isValid(value);
        },
      },
    });
  };
}