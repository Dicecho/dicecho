import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getObjectId } from '@app/utils';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Notice as NoticeDocument } from './schemas';
import { AccessLevel } from './ineterface';
import { NotFoundException, ForbiddenException, ConflictException } from '@app/core';
import { UpdateNoticeDto, CreateNoticeDto } from './dto';

@Injectable()
export class NoticeService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(NoticeDocument.name) public readonly noticeModel: Model<NoticeDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async checkNoticeReadPermission(notice: NoticeDocument, user?: UserDocument) {
    if (notice.isDeleted) {
      throw new ForbiddenException('通知不存在')
    }

    if (user && user.checkRole('superuser')) {
      return true;
    }

    if (!notice.isPublic) {
      throw new ForbiddenException('通知不存在')
    }
  }

  async checkNoticeManagePermission(notice: NoticeDocument, user?: UserDocument) {
    if (!user) {
      throw new ForbiddenException('无法管理此通知')
    }

    if (!user.checkRole('superuser')) {
      throw new ForbiddenException('无法管理此通知')
    }
  }

  async getNotice(uniqueName: string) {
    const notice = await this.noticeModel.findOne({ uniqueName });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }

    return notice;
  }

  async createNotice(dto: CreateNoticeDto) {
    const nNotice = new this.noticeModel({
      ...dto,
    })
    await nNotice.save();

    return nNotice;
  }

  async updateNotice(notice: NoticeDocument, dto: UpdateNoticeDto) {
    await this.noticeModel.updateOne(
      { _id: notice._id },
      { 
        ...dto,
      },
      { upsert: true },
    )
  }

  async deleteNotice(notice: NoticeDocument) {
    await this.noticeModel.updateOne(
      { _id: notice._id },
      { 
        isDeleted: true,
      },
      { upsert: true },
    )
  }
}
