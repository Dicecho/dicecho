import { Public } from '@app/auth/decorators/public.decorator';
import {
  makePaginationResponse,
  PageableQuery,
  serialize,
  serializeResponse,
  UserDecorator
} from '@app/core';
import { LogListQuery } from '@app/operationLog/dto';
import {
  AdminLogSerializer,
  OperationLogSerializer
} from '@app/operationLog/serializers';
import { OperationLogService } from '@app/operationLog/services';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Controller, Get, Param, Query } from '@nestjs/common';

@Controller('log')
export class OperationLogController {
  constructor(private operationLogService: OperationLogService) {}

  @Public()
  @Get(':targetName/:targetId')
  async getTarget(
    @Param('targetName') targetName: string,
    @Param('targetId') targetId: string,
    @Query() query: PageableQuery,
    @UserDecorator() user?: UserDocument,
  ) {
    const { pageSize, page, sort = { createdAt: -1 } } = query;

    const filter = {
      targetName,
      targetId,
    };

    const result = await this.operationLogService.operationLogModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate('operator');

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    const ctx = {
      user,
    };

    return {
      totalCount: await this.operationLogService.operationLogModel.countDocuments(
        filter,
      ),
      page,
      pageSize,
      data: serialize(OperationLogSerializer, returnData, ctx) as any,
      hasNext,
    };
  }

  @Public()
  @Get()
  async getAll(
    @Query() query: LogListQuery,
    @UserDecorator() user?: UserDocument,
  ) {
    const { pageSize, page, sort = { createdAt: -1 }, filter } = query;

    const filterQuery = (() => {
      const { changedKey, ...result } = filter;
      if (changedKey) {
        Object.assign(result, {
          changedKeys: { $all: [changedKey] },
        });
      }
      // if (filter.targetId) {
      //   Object.assign(result, { targetId })
      // }

      return result;
    })();

    // console.log(filterQuery)

    const result = await makePaginationResponse(
      this.operationLogService.operationLogModel,
      filterQuery,
      query,
    );

    const ctx = {
      user,
    };

    return await serializeResponse(result, OperationLogSerializer, ctx);
  }

  @Public()
  @Get('admin')
  async getAdminLog(
    @Query() query: PageableQuery,
    @UserDecorator() user?: UserDocument,
  ) {
    const { pageSize, page, sort = { createdAt: -1 } } = query;
    const filter = {};

    const result = await this.operationLogService.adminLogModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate('operator');

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    const ctx = {
      user,
    };

    return {
      totalCount: await this.operationLogService.adminLogModel.countDocuments(
        filter,
      ),
      page,
      pageSize,
      data: serialize(AdminLogSerializer, returnData, ctx) as any,
      hasNext,
    };
  }
}
