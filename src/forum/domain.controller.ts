import { Controller, Get, Post, Body, Query, Param, Put, Delete } from '@nestjs/common';
import { UserDecorator, serialize, NotFoundException, makePaginationResponse, serializeResponse } from '@app/core';
import { getObjectId } from '@app/utils';
import { Public } from '@app/auth/decorators/public.decorator';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { ForumService } from './forum.service';
import { DomainService } from './domain.service';
import { ModService } from '@app/mod/services';
import { PaginatedResponse } from '@app/interfaces/shared/api';
import { LikeService } from '@app/like/like.service';
import { ObjectId } from 'mongodb';
import { 
  CreateTopicDto,
  UpdateTopicDto,
  TopicListQuery,
  DomainListQuery,
} from './dto';
import { 
  TopicSerializer, ITopicDto,
  DomainSerializer, IDomainDto,
} from './serializers';

@Controller('domain')
export class DomainController {
  constructor(
    private forumService: ForumService,
    private domainService: DomainService,
    private likeService: LikeService,
    private modService: ModService,
  ) {}

  @Get()
  @Public()
  async list(
    @Query() query: DomainListQuery,
    @UserDecorator() user?: UserDocument,
  ): Promise<PaginatedResponse<IDomainDto>> {
    const { isJoined, filter } = query;

    const filterQuery = await (async () => {
      const query = {
        ...filter,
        isDeleted: { $ne: true },
      }

      if (isJoined !== undefined) {
        const joinedDomainMember = await this.domainService.getJoinedDomain(user)
        Object.assign(query, {
          _id: { $in: joinedDomainMember.map(member => getObjectId(member.domain)) }
        })
      }


      return query;
    })();

    const result = await makePaginationResponse(
      this.domainService.domainModel,
      filterQuery,
      query,
    )
  
    const ctx = {
      user,
    }

    return await serializeResponse(result, DomainSerializer, ctx);
  }

  @Get(':uuidOrTitle')
  @Public()
  async retrieve(
    @Param('uuidOrTitle') uuidOrTitle: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<IDomainDto> {
    const domain = await this.domainService.getDomain(uuidOrTitle)
    
    if (!domain || domain.isDeleted) {
      throw new NotFoundException('此板块不存在')
    }

    const ctx = {
      user,
      joinedDomainIds: (await this.domainService.getJoinedDomain(user)).map(member => getObjectId(member.domain).toHexString())
    }

    return serialize(DomainSerializer, domain, ctx) as IDomainDto
  }

  @Post(':uuidOrTitle/join')
  async join(
    @Param('uuidOrTitle') uuidOrTitle: string,
    @UserDecorator() user: UserDocument,
  ) {
    const domain = await this.domainService.getDomain(uuidOrTitle)
    
    if (!domain || domain.isDeleted) {
      throw new NotFoundException('此板块不存在')
    }

    await this.domainService.joinDomain(user, domain)
  }

  @Post(':uuidOrTitle/exit')
  async exit(
    @Param('uuidOrTitle') uuidOrTitle: string,
    @UserDecorator() user: UserDocument,
  ) {
    const domain = await this.domainService.getDomain(uuidOrTitle)
    
    if (!domain || domain.isDeleted) {
      throw new NotFoundException('此板块不存在')
    }

    await this.domainService.deleteDomainMember(user._id.toHexString(), domain._id.toHexString())
  }

  // @Post()
  // async create(
  //   @Body() createTopicDto: CreateTopicDto,
  //   @UserDecorator() user: UserDocument,
  // ): Promise<ITopicDto> {
  //   if (!createTopicDto.modId && !createTopicDto.domainId) {
  //     throw new BadRequestException('请选择发帖所在的板块')
  //   }

  //   const domainId = await (async () => {
  //     if (createTopicDto.domainId) {
  //       return createTopicDto.domainId;
  //     }

  //     return (await this.forumService.getOrCreateModDomainId(createTopicDto.modId)).toHexString()
  //   })();

  //   const topic = new this.forumService.topicModel({
  //     domain: new ObjectId(domainId),
  //     author: user._id,
  //     title: createTopicDto.title,
  //     content: createTopicDto.content,
  //   })
  //   await topic.save()
  //   await this.forumService.domainModel.updateOne(
  //     { _id: new ObjectId(domainId) },
  //     { $inc: { topicCount: 1 } },
  //     { upsert: true },
  //   );

  //   const nTopic = await this.forumService.topicModel.findById(topic._id)
  //     .populate('domain')
  //     .populate('author')

  //   const ctx = {
  //     user,
  //   }

  //   if (user) {
  //     Object.assign(ctx, {
  //       ...await this.likeService.getLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
  //       ...await this.likeService.getdisLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
  //     })
  //   }

  //   return serialize(TopicSerializer, nTopic, ctx) as ITopicDto
  // }

  // @Put(':uuid')
  // async update(
  //   @Param('uuid') uuid: string,
  //   @Body() updateTopicDto: UpdateTopicDto,
  //   @UserDecorator() user: UserDocument,
  // ): Promise<ITopicDto> {
  //   const topic = await this.forumService.topicModel.findById(uuid)
  //     .populate('domain')
  //     .populate('author')
    
  //   if (topic.isDeleted) {
  //     throw new NotFoundException('该帖已被删除')
  //   }

  //   if (!this.forumService.checkTopicPermission(topic, user)) {
  //     throw new ForbiddenException('您没有权限修改此帖')
  //   }

  //   await this.forumService.topicModel.updateOne(
  //     { _id: topic._id },
  //     updateTopicDto,
  //     { upsert: true },
  //   )

  //   const ctx = {
  //     user,
  //     ...await this.likeService.getLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
  //     ...await this.likeService.getdisLikeableCtx(this.forumService.topicModel.modelName, user._id.toHexString()),
  //   }

  //   return serialize(TopicSerializer, topic, ctx) as ITopicDto
  // }

  // @Delete(':uuid')
  // async delete(
  //   @Param('uuid') uuid: string,
  //   @UserDecorator() user: UserDocument,
  // ) {
  //   const topic = await this.forumService.topicModel.findById(uuid)
  //     .populate('domain')
  //     .populate('author')
    
  //   if (topic.isDeleted) {
  //     throw new NotFoundException('该帖已被删除')
  //   }

  //   if (!this.forumService.checkTopicPermission(topic, user)) {
  //     throw new ForbiddenException('您没有权限删除此帖')
  //   }

  //   topic.isDeleted = true;
  //   await this.forumService.domainModel.updateOne(
  //     { _id: topic.domain },
  //     { $inc: { topicCount: -1 } },
  //     { upsert: true },
  //   );

  //   await topic.save()
  // }
}
