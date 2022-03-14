import { Public } from '@app/auth/decorators/public.decorator';
import {
  makePaginationResponse,
  serialize,
  serializeResponse,
  UserDecorator,
} from '@app/core';
import { PaginatedResponse } from '@app/interfaces/shared/api';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateReplayDto, ReplayListQuery, UpdateReplayDto } from './dto';
import { IReplayDto } from './interface';
import { ReplayService } from './replay.service';
import { ReplaySerializer } from './serializers';

@Controller('replay')
export class ReplayController {
  constructor(private replayService: ReplayService) {}

  @Get(':bvid')
  @Public()
  async retrieve(
    @Param('bvid') bvid: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<IReplayDto> {
    const result = await this.replayService.getOrCreateReplay(bvid);
    await this.replayService.replayModel.updateOne(
      { _id: result._id },
      { $inc: { clickCount: 1 } },
      { upsert: true },
    );

    const ctx = {
      user,
    };

    return serialize(ReplaySerializer, result, ctx) as IReplayDto;
  }

  @Get()
  @Public()
  async list(
    @Query() query: ReplayListQuery,
    @UserDecorator() user?: UserDocument,
  ): Promise<PaginatedResponse<IReplayDto>> {
    const { pageSize, page, sort, filter } = query;

    const filterQuery = {
      ...filter,
    };

    const result = await makePaginationResponse(
      this.replayService.replayModel,
      filterQuery,
      query,
    );

    const ctx = {
      user,
    };

    return await serializeResponse(result, ReplaySerializer, ctx);
  }

  @Post()
  async create(
    @Body() body: CreateReplayDto,
    @UserDecorator() user: UserDocument,
  ): Promise<IReplayDto> {
    const result = await this.replayService.creteReplayFromBvid(
      body.bvid,
      body.modId,
    );

    const ctx = { user };
    return serialize(ReplaySerializer, result, ctx) as IReplayDto;
  }

  @Put(':bvid')
  async update(
    @Param('bvid') bvid: string,
    @Body() body: UpdateReplayDto,
    @UserDecorator() user: UserDocument,
  ): Promise<IReplayDto> {
    const result = await this.replayService.updateReplay(bvid, body.modId);

    const ctx = { user };
    return serialize(ReplaySerializer, result, ctx) as IReplayDto;
  }
}
