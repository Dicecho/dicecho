import _ from 'lodash';

export * from './loadClassMethods';
export * from './promise';
export * from './mixins';
export * from './serializer';
export * from './type';
export * from './response';
export * from './request';


export function getChangedKeys(data, changedObj) {
  return Object.keys(changedObj)
  .map((key) => ({ key, value: !_.isEqual(changedObj[key], data[key]) }))
  .reduce((a, b) => b.value ? [...a, b.key] : a, []) as string[]
}
