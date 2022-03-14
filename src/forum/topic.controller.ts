import { Controller, Get, Post, Body, Query, Param, Put, Delete } from '@nestjs/common';
import { UserDecorator, serialize, NotFoundException, BadRequestException, ForbiddenException, getChangedKeys } from '@app/core';
import { Public } from '@app/auth/decorators/public.decorator';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { SearchQuery } from '@app/search/dto';
import { ForumService } from './forum.service';
import { ModService } from '@app/mod/services';
import { PaginatedResponse } from '@app/interfaces/shared/api';
import { LikeService } from '@app/like/like.service';
import { ObjectId } from 'mongodb';
import { 
  CreateTopicDto,
  UpdateTopicDto,
  TopicListQuery,
} from './dto';
import { BlockService } from '@app/block/block.service';
import { BlockTargetName } from '@app/block/interface';
import { TopicSerializer, ITopicDto } from './serializers';
import { getObjectId } from '@app/utils';

@Controller('topic')
export class TopicController {
  constructor(
    private forumService: ForumService,
    private likeService: LikeService,
    private modService: ModService,
    private blockService: BlockService,
  ) {}

  @Get('search')
  @Public()
  async search(
    @Query() searchQuery: SearchQuery,
    @UserDecorator() user?: UserDocument,
  ) {
    const { page, pageSize } = searchQuery;
    const result = await this.forumService.searchTopic(searchQuery);
    let dataIds: Array<string> = result.body.hits.hits.map(item => item._id);

    const hasNext = dataIds.length > pageSize;
    dataIds = dataIds.length === 1 || !hasNext
        ? dataIds
        : dataIds.slice(0, dataIds.length - 1);
    
    const data = await this.forumService.topicModel.find({
      _id: { $in: dataIds.map(id => new ObjectId(id)) },
    })
      .populate('domain')
      .populate('author')
      .populate('relatedMods')

    const returnData = dataIds.map((id) => data.find(m => m._id.toString() === id))

    const ctx = {
      user,
    }

    if (user) {
      Object.assign(ctx, {
        ...await this.likeService.getLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
        ...await this.likeService.getdisLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
      })
    }
  
    return {
      totalCount: result.body.hits.total.value,
      page: page,
      pageSize: pageSize,
      data: serialize(TopicSerializer, returnData, ctx) as Array<ITopicDto>,
      hasNext,
    };
  }

  @Get()
  @Public()
  async list(
    @Query() query: TopicListQuery,
    @UserDecorator() user?: UserDocument,
  ): Promise<PaginatedResponse<ITopicDto>> {
    const { pageSize, page, sort, modId, filter } = query;

    const filterQuery = await (async () => {
      const query: {
        $and: Array<any>,
      } = {
        $and: [
          { isDeleted: false },
        ]
      }

      if (modId) {
        query.$and.push({
          relatedMods: { $in: [modId] },
        })
      }

      if (filter && filter.author) {
        query.$and.push({
          author: new ObjectId(filter.author),
        })
      }

      if (filter && filter.domain) {
        query.$and.push({
          domain: new ObjectId(filter.domain),
        })
      }

      if (user) {
        const blockUserIds = await this.blockService.getUserBlockIds(BlockTargetName.User, user._id.toHexString())
        if (blockUserIds.length > 0) {
          query.$and.push({
            author: { $nin: blockUserIds.map(id => new ObjectId(id)) },
          })
        }
      }

      return query;
    })();

    const result = await this.forumService.topicModel
      .find(filterQuery)
      .sort(sort)
      .populate('domain')
      .populate('relatedMods')
      .populate('author')
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1);

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    const ctx = {
      user,
    }

    if (user) {
      Object.assign(ctx, {
        ...await this.likeService.getLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
        ...await this.likeService.getdisLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
      })
    }

    return {
      totalCount: await this.forumService.topicModel.countDocuments(filterQuery),
      page,
      pageSize,
      data: serialize(TopicSerializer, returnData, ctx) as Array<ITopicDto>,
      hasNext,
    };
  }

  @Get(':uuid')
  @Public()
  async retrieve(
    @Param('uuid') uuid: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<ITopicDto> {
    const topic = await this.forumService.topicModel.findById(uuid)
      .populate('domain')
      .populate('relatedMods')
      .populate('author')
    
    if (!topic) {
      throw new NotFoundException('帖子不存在')
    }

    if (topic.isDeleted) {
      throw new NotFoundException('此帖已被删除')
    }

    await this.forumService.topicModel.updateOne(
      { _id: topic._id },
      { $inc: { readCount: 1 } },
      { upsert: true },
    )

    const mod = await this.modService.modModel.findOne({ domain: getObjectId(topic.domain) })

    const ctx = {
      user,
    }

    if (user) {
      Object.assign(ctx, {
        ...await this.likeService.getLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
        ...await this.likeService.getdisLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
      })
    }

    if (mod) {
      Object.assign(ctx, {
        mod,
      })
    }

    return serialize(TopicSerializer, topic, ctx) as ITopicDto
  }

  @Post()
  async create(
    @Body() createTopicDto: CreateTopicDto,
    @UserDecorator() user: UserDocument,
  ): Promise<ITopicDto> {
    const nTopic = await this.forumService.createTopic(createTopicDto, user);
    const ctx = {
      user,
    }

    if (user) {
      Object.assign(ctx, {
        ...await this.likeService.getLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
        ...await this.likeService.getdisLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
      })
    }

    return serialize(TopicSerializer, nTopic, ctx) as ITopicDto
  }

  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @UserDecorator() user: UserDocument,
  ): Promise<ITopicDto> {
    const topic = await this.forumService.topicModel.findById(uuid)
      .populate('domain')
      .populate('author')
      .populate('relatedMods')
    
    if (!topic) {
      throw new NotFoundException('帖子不存在')
    }

    if (topic.isDeleted) {
      throw new NotFoundException('此帖已被删除')
    }

    if (!this.forumService.checkTopicPermission(topic, user)) {
      throw new ForbiddenException('您没有权限修改此帖')
    }

    const nTopic = await this.forumService.updateTopic(updateTopicDto, topic)

    const ctx = {
      user,
      ...await this.likeService.getLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
      ...await this.likeService.getdisLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
    }

    return serialize(TopicSerializer, nTopic, ctx) as ITopicDto
  }

  @Delete(':uuid')
  async delete(
    @Param('uuid') uuid: string,
    @UserDecorator() user: UserDocument,
  ) {
    const topic = await this.forumService.topicModel.findById(uuid)
      .populate('domain')
      .populate('author')
      .populate('relatedMods')
    
    if (topic.isDeleted) {
      throw new NotFoundException('此帖已被删除')
    }

    if (!this.forumService.checkTopicPermission(topic, user)) {
      throw new ForbiddenException('您没有权限删除此帖')
    }

    await this.forumService.deleteTopic(topic);
  }
}
