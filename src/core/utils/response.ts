import { PaginatedResponse } from '@app/interfaces/shared/api';
import { Connection, Model, Document } from 'mongoose';
import { serialize } from './serializer';
import { PageableQuery } from '../dto';

export async function makePaginationResponse<T extends Document>(
  model: Model<T>,
  filter: any,
  query: Partial<PageableQuery>,
): Promise<PaginatedResponse<T>> {
  const { page = 10, pageSize = 1, sort = {} } = query;
  
  const result = await model
  .find(filter)
  .sort(sort)
  .skip((page - 1) * pageSize)
  .limit(pageSize + 1);

  const hasNext = result.length > pageSize;
  const returnData =
    result.length === 1 || !hasNext
      ? result
      : result.slice(0, result.length - 1);

  return {
    totalCount: await model.countDocuments(filter),
    page,
    pageSize,
    data: returnData,
    hasNext,
  };
}

export async function serializeResponse<DTO = any>(
  response: PaginatedResponse,
  serializer: any,
  context: any,
): Promise<PaginatedResponse<DTO>> {
  const { data, ...config } = response;

  return {
    data: serialize(serializer, data, context) as Array<DTO>,
    ...config
  };
}
