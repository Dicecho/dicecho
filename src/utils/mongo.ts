import { ObjectId } from 'mongodb';
import { BaseDocument } from '@app/core';

export function objectIdEquals(a: ObjectId, b: ObjectId) {
  return a.equals(b)
}

export function getObjectId(target: ObjectId | BaseDocument) {
  return target instanceof ObjectId ? target : target._id;
}