import { Controller, Get, Param, Put, Query, Body, Post } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { TagSerializer } from '@app/tag/serializers';
import { ITag, TagQuery, CreateTagDto, UpdateTagDto } from '@app/tag/dto';
import { ReportService } from '@app/report/report.service';
import { TagErrorCode } from '@app/interfaces/shared/errorcode/tag';
import { PaginatedResponse } from '@app/interfaces/shared/api';
import { Public } from '@app/auth/decorators/public.decorator';
import { TagService } from '@app/tag/tag.service';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { ReportClassification } from '@app/report/constants';
import { Roles } from '@app/auth/decorators';
import { Role } from '@app/auth/roles.enum';
import { UserDecorator, serialize, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@app/core';
import _ from 'lodash';


@Controller('tag')
export class TagController {
  constructor(
    private tagService: TagService,
  ) {}

  getQuery(query: TagQuery) {
    const { pageSize, page, keyword, parent, isCategory } = query;

    const result = {}

    if (parent) {
      Object.assign(result, {
        parents: { '$all': [parent] } 
      })
    }

    if (isCategory) {
      Object.assign(result, {
        isCategory
      })
    }

    return result
  }

  @Public()
  @Get()
  async findAll(
    @Query() query: TagQuery,
  ): Promise<PaginatedResponse<ITag>> {
    const { pageSize, page, keyword } = query;

    if (keyword && keyword !== '') {
      const result = await this.tagService.searchTag(query);
      let tagIds: Array<string> = result.body.hits.hits.map(item => item._id);

      const hasNext = tagIds.length > pageSize;
      tagIds = tagIds.length === 1 || !hasNext
          ? tagIds
          : tagIds.slice(0, tagIds.length - 1);
      
      const mod = await this.tagService.tagModel.find({
        _id: { $in: tagIds.map(id => new ObjectId(id)) },
      })
      .populate('author');

      const resultMods = tagIds.map((id) => mod.find(m => m._id.toString() === id))

      return {
        totalCount: result.body.hits.total.value,
        page: page,
        pageSize: pageSize,
        data: serialize(TagSerializer, resultMods) as Array<ITag>,
        hasNext,
      };
    }

    const filterQuery = this.getQuery(query);

    const result = await this.tagService.tagModel
      .find(filterQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);
    

    return {
      totalCount: await this.tagService.tagModel.countDocuments({}),
      page,
      pageSize,
      data: serialize(TagSerializer, returnData) as Array<ITag>,
      hasNext: result.length > pageSize,
    };
  }

  @Public()
  @Get('modRecommend')
  async modRecommend(): Promise<Array<ITag>> {
    const result = await this.tagService.tagModel
      .find()
      .sort({ 'modCount': -1 })
      .limit(15)

    return serialize(TagSerializer, result) as Array<ITag>;
  }

  @Public()
  @Get('test')
  async test(
    @Query('tagNames') tagNames: Array<string> = [],
  ) {
    // const tag = await this.tagService.getOrCreateTagMap(tagNames);
  }

  @Public()
  @Get(':idOrName')
  async retrieve(
    @Param('idOrName') idOrName: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<ITag> {
    const tag = await this.tagService.findOneTag(idOrName);

    if (!tag) {
      throw new NotFoundException('未找到指定标签', 404, TagErrorCode.NOT_FOUND_TAG);
    }
  
    const ctx = {
      user,
    }

    return serialize(TagSerializer, tag, ctx) as ITag
  }

  @Post()
  async create(
    @Body() createTagDto: CreateTagDto,
    @UserDecorator() user: UserDocument,
  ) {
    const tag = (await this.tagService.getOrCreateTags([createTagDto.name]))[0]

    const nTag = await this.tagService.tagModel.findOne({
      name: tag.name
    })

    const ctx = {
      user,
    }
    
    if (!nTag) {
      return serialize(TagSerializer, tag, ctx) as ITag
    }

    return serialize(TagSerializer, nTag, ctx) as ITag
  }

  @Put(':name')
  async update(
    @Param('name') name: string,
    @Body() updateTagDto: UpdateTagDto,
    @UserDecorator() user: UserDocument,
  ) {
    const tag = await this.tagService.tagModel.findOne({ name })
    
    if (!tag) {
      if (!tag) {
        throw new NotFoundException('未找到指定标签', 404, TagErrorCode.NOT_FOUND_TAG);
      }
    }

    if (!await this.tagService.checkEditPermission(user, tag)) {
      throw new ForbiddenException('您没有编辑权限')
    }

    const ctx = {
      user,
    }

    const nTag = await this.tagService.updateTag(user, tag, updateTagDto);

    return serialize(TagSerializer, nTag, ctx) as ITag  
  }
}
