import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { UserDecorator, serialize, makePaginationResponse, serializeResponse } from '@app/core';
import { PaginatedResponse } from '@app/interfaces/shared/api';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { NoticeSerializer } from './serializers';
import { INoticeDto, AccessLevel } from './ineterface';
import { Roles } from '@app/auth/decorators';
import { Role } from '@app/auth/roles.enum';
import { Public } from '@app/auth/decorators/public.decorator';
import { NoticeService } from './notice.service';
import { NoticeListQuery, CreateNoticeDto, UpdateNoticeDto } from './dto'; 

@Controller('notice')
export class NoticeController {
  constructor(
    private noticeService: NoticeService,
  ) {}

  @Get()
  @Public()
  async list(
    @Query() query: NoticeListQuery,
    @UserDecorator() user?: UserDocument,
  ): Promise<PaginatedResponse<INoticeDto>> {

    const filterQuery = await (async () => {
      const result = {
        $and: []
      }
    
      result.$and.push({ isDeleted: { $ne: true } })

      if (!user.checkRole('superuser')) {
        result.$and.push({ isPublic: true })
      }

      return result;
    })();

    const result = await makePaginationResponse(
      this.noticeService.noticeModel,
      filterQuery,
      query,
    )
  
    const ctx = {
      user,
    }

    return await serializeResponse(result, NoticeSerializer, ctx);
  }

  @Get(':uniqueName')
  @Public()
  async retrieve(
    @Param('uniqueName') uniqueName: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<INoticeDto> {
    const notice = await this.noticeService.getNotice(uniqueName)
    await this.noticeService.checkNoticeReadPermission(notice, user);
  
    const ctx = {
      user,
    }

    return serialize(NoticeSerializer, notice, ctx) as INoticeDto
  }

  @Roles(Role.Superuser)
  @Post()
  async create(
    @Body() createTopicDto: CreateNoticeDto,
    @UserDecorator() user: UserDocument,
  ): Promise<INoticeDto> {
    const notice = await this.noticeService.createNotice(createTopicDto)
  
    const ctx = {
      user,
    }


    return serialize(NoticeSerializer, notice, ctx) as INoticeDto
  }

  @Roles(Role.Superuser)
  @Put(':uniqueName')
  async update(
    @Param('uniqueName') uniqueName: string,
    @Body() updateTopicDto: UpdateNoticeDto,
    @UserDecorator() user: UserDocument,
  ): Promise<INoticeDto> {
    const notice = await this.noticeService.getNotice(uniqueName)
    await this.noticeService.checkNoticeManagePermission(notice, user);
    await this.noticeService.updateNotice(notice, updateTopicDto);

    const nNotice = await this.noticeService.noticeModel.findById(notice._id)

    const ctx = {
      user,
    }

    return serialize(NoticeSerializer, nNotice, ctx) as INoticeDto
  }

  @Roles(Role.Superuser)
  @Delete(':uniqueName')
  async delete(
    @Param('uniqueName') uniqueName: string,
    @UserDecorator() user: UserDocument,
  ) {
    const notice = await this.noticeService.getNotice(uniqueName)
    await this.noticeService.checkNoticeManagePermission(notice, user);
    await this.noticeService.deleteNotice(notice);
  }
}
