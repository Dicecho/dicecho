import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { UserDecorator, serialize, NotFoundException, BadRequestException } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { ObjectId } from 'mongodb';
import { NotificationService } from './notification.service';
import { NotificationListQuery } from './dto';
import { NotificationSerializer } from './serializers';

@Controller('notification')
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
  ) {}

  @Get()
  async list(
    @Query() query: NotificationListQuery,
    @UserDecorator() user: UserDocument,
  ) {
    const { pageSize, page, filter } = query;

    const filterQuery = await (async () => {
      const query = {
        ...filter,
        recipient: user._id,
        isDeleted: false,
      }
      return query;
    })();

    const result = await this.notificationService.notificationModel
      .find(filterQuery)
      .sort({ createdAt: -1 })
      .populate('recipient')
      .populate('sender')
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

    return {
      totalCount: await this.notificationService.notificationModel.countDocuments(filterQuery),
      unreadCount: await this.notificationService.notificationModel.countDocuments({ isUnread: true, recipient: user._id }),
      page,
      pageSize,
      data: serialize(NotificationSerializer, returnData, ctx),
      hasNext,
    };
  }

  @Post(':uuid/mark')
  async mark(
    @Param('uuid') uuid: string,
    @UserDecorator() user: UserDocument,
  ) {
    const notification = await this.notificationService.notificationModel.findById(uuid)
      .populate('recipient')
      .populate('sender')

    if (!notification) {
      throw new NotFoundException('未发现指定提醒');
    }

    if (!user._id.equals(notification.recipient instanceof ObjectId ? notification.recipient : notification.recipient._id)) {
      throw new BadRequestException('此提醒不属于你');
    }

    notification.isUnread = false;
    await notification.save();

    return serialize(NotificationSerializer, notification)
  }


  @Post('markAll')
  async markAll(
    @UserDecorator() user: UserDocument,
  ) {
    await this.notificationService.notificationModel.updateMany(
      { recipient: user._id, isUnread: true },
      { isUnread: false },
      { upsert: true },
    )
  }
}
