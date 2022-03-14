import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { IFollowable, Follow as FollowDocument } from './schemas';
import { FollowableCtx, unfollowableCtx } from './serializers';
import { ConflictException, NotFoundException, BadRequestException } from '@app/core';
import { FOLLOW_EVENT_KEYS } from './events';

@Injectable()
export class FollowService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(FollowDocument.name) public readonly followModel: Model<FollowDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async followBy(targetName: string, targetId: string, userId: string) {
    const modelNames = this.connection.modelNames()
    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    const target = await this.connection.model<IFollowable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    const follow = await this.followModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
    })

    if (follow) {
      throw new ConflictException('已经关注过了')
    }

    const nFollow = new this.followModel({
      targetName,
      targetId,
      user: new ObjectId(userId),
    });

    await nFollow.save();

    await this.connection.model<IFollowable>(targetName).updateOne(
      { _id: new ObjectId(targetId) },
      { $inc: { followCount: 1 } },
      { upsert: true },
    )

    this.eventEmitter.emit(
      FOLLOW_EVENT_KEYS.CREATED,
      {
        targetName,
        targetId,
        userId,
      },
    );
  }

  async unFollowBy(targetName: string, targetId: string, userId: string) {
    const modelNames = this.connection.modelNames()
    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    const target = await this.connection.model<IFollowable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    const follow = await this.followModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
    })

    if (!follow) {
      throw new BadRequestException('还未关注过')
    }

    await this.connection.model<IFollowable>(targetName).updateOne(
      { _id: new ObjectId(targetId) },
      { $inc: { followCount: -1 } },
      { upsert: true },
    )

    await this.followModel.deleteOne({ _id: new ObjectId(follow._id) });

    this.eventEmitter.emit(
      FOLLOW_EVENT_KEYS.CANCEL,
      {
        targetName,
        targetId,
        userId,
      },
    );
  }

  async getUserFollowIds(targetName: string, userId: string) {
    const result = await this.followModel.find({ targetName, user: new ObjectId(userId) })

    return result.map(r => r.targetId);
  }

  async getFollowableCtx(targetName: string, userId: string = ''): Promise<FollowableCtx> {
    if (!userId || userId === '') {
      return {
        userFollowIds: []
      }
    }

    return {
      userFollowIds: await this.getUserFollowIds(targetName, userId)
    }
  }
}
