import { Operation } from '@app/interfaces/shared/api/base';

export const MONGO_ES_OPERATION_MAP = {
  [Operation.GT]: 'gt',
  [Operation.GTE]: 'gte',
  [Operation.LT]: 'lt',
  [Operation.LTE]: 'lte',
}

export const SEARCH_MODULE_OPTIONS = 'SEARCH_MODULE_OPTIONS';