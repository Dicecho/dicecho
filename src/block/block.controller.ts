import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UserDecorator, serialize, makePaginationResponse, serializeResponse } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BlockService } from './block.service';
import { ObjectId } from 'mongodb';
import { BlockSerializer } from './serializers';
import { BlockDto, BlockQuery } from './dto';
import { Public } from '@app/auth/decorators';

@Controller('block')
export class BlockController {
  constructor(
    private blockService: BlockService,
  ) {}


  @Get('count')
  async count(
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    const data = await this.blockService.blockModel.find({ user: user._id })

    const result = data.reduce((a, b) => ({
      ...a,
      [b.targetName]: (a[b.targetName] || 0) + 1,
    }), {})

    return result
  }

  @Get('self')
  async self(
    @Query() query: BlockQuery,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    const { page = 10, pageSize = 1, sort = {}, filter } = query;

    const filterQuery = await (async () => {
      const result = {
        $and: []
      }

      result.$and.push({ user: user._id })

      if (filter) {
        result.$and.push(filter)
      }

      return result;
    })();

    const data = await this.blockService.blockModel
      .find(filterQuery)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate('target');
  
    const hasNext = data.length > pageSize;
    const returnData =
      data.length === 1 || !hasNext
        ? data
        : data.slice(0, data.length - 1);

  
    const ctx = {
      user,
    }

    const result = {
      totalCount: await this.blockService.blockModel.countDocuments(filterQuery),
      page,
      pageSize,
      data: returnData,
      hasNext,
    };

    return await serializeResponse(result, BlockSerializer, ctx);
  }

  @Post()
  async block(
    @Body() blockDto: BlockDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.blockService.blockBy(blockDto.targetName, blockDto.targetId, user._id.toString());
  }

  @Post('cancel')
  async unblock(
    @Body() blockDto: BlockDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.blockService.unBlockBy(blockDto.targetName, blockDto.targetId, user._id.toString());
  }
}
