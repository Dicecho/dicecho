import _ from 'lodash';

export function computeDifference<T>(
  currentState: Array<T>,
  newState: Array<T>,
  func: (a: T, b: T) => boolean = _.isEqual,
) {

  return {
    add: _.differenceWith(newState, currentState, func),
    remove: _.differenceWith(currentState, newState, func),
  }
}