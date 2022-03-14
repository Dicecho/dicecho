import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ILikeable, Like as LikeDocument, LikeAttitude, CompatibleAttitude, UniqueAttitudes } from './schemas';
import { LikeableCtx, disLikeableCtx, DecalreableCtx } from './serializers';
import { ConflictException, NotFoundException, BadRequestException } from '@app/core';
import { LIKE_EVENT_KEYS } from './events';

@Injectable()
export class LikeService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(LikeDocument.name) public readonly likeModel: Model<LikeDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getGenericObject(targetName: string, targetId: string) {
    const modelNames = this.connection.modelNames()

    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    let target = await this.connection.model<ILikeable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    return target
  }

  async declareBy(targetName: string, targetId: string, userId: string, attitude: LikeAttitude, weight: number = 1): Promise<ILikeable> {
    await this.getGenericObject(targetName, targetId);

    const like = await this.likeModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
      attitude,
    })

    if (like) {
      throw new ConflictException('已经表过态了')
    }

    if (CompatibleAttitude.findIndex((a) => a === attitude) === -1) {

      const uniqueDeclare = await this.likeModel.findOne({
        targetName,
        targetId,
        user: new ObjectId(userId),
        attitude: { $in: UniqueAttitudes }
      })

      if (uniqueDeclare) {
        await this.cancelDeclareBy(targetName, targetId, userId, uniqueDeclare.attitude)
        const result = await this.declareBy(targetName, targetId, userId, attitude, weight)
        return result;
      }
    }

    const nLike = new this.likeModel({
      targetName,
      targetId,
      user: new ObjectId(userId),
      attitude,
      weight,
    });

    await nLike.save();

    await this.connection.model<ILikeable>(targetName).updateOne(
      { _id: new ObjectId(targetId) },
      { $inc: { 
          [`${attitude}Count`]: weight,
          [`declareCounts.${attitude}`]: weight,
        }
      },
      { upsert: true },
    )

    this.eventEmitter.emit(
      LIKE_EVENT_KEYS.CREATED,
      {
        targetName,
        targetId,
        attitude,
        userId,
      },
    );

    const nTarget = await this.connection.model<ILikeable>(targetName).findById(targetId);

    return nTarget;
  }

  async cancelDeclareBy(targetName: string, targetId: string, userId: string, attitude: LikeAttitude) {
    await this.getGenericObject(targetName, targetId);

    const like = await this.likeModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
      attitude,
    })

    if (!like) {
      throw new BadRequestException('还未点过赞')
    }

    await this.connection.model<ILikeable>(targetName).updateOne(
      { _id: new ObjectId(targetId) },
      { $inc: { 
          [`${attitude}Count`]: - (like.weight || 1),
          [`declareCounts.${attitude}`]: - (like.weight || 1),
        }
      },
      { upsert: true },
    )

    await this.likeModel.deleteOne({ _id: new ObjectId(like._id) });

    this.eventEmitter.emit(
      LIKE_EVENT_KEYS.CANCEL,
      {
        targetName,
        targetId,
        attitude,
        userId,
      },
    );

    const nTarget = await this.connection.model<ILikeable>(targetName).findById(targetId);

    return nTarget;
  }

  async likeBy(targetName: string, targetId: string, userId: string, weight: number = 1) {
    const modelNames = this.connection.modelNames()
    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    const target = await this.connection.model<ILikeable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    const like = await this.likeModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
      attitude: { $in: [LikeAttitude.like, LikeAttitude.dislike] }
    })

    if (like) {
      if (like.attitude === undefined) {
        like.attitude = LikeAttitude.like;
        like.save()
        throw new ConflictException('已经点过赞了')
      }
  
      if (like.attitude === LikeAttitude.like) {
        throw new ConflictException('已经点过赞了')
      }
  
      if (like.attitude === LikeAttitude.dislike) {
        await this.cancelLikeBy(targetName, targetId, userId)
        await this.likeBy(targetName, targetId, userId, weight)
        return;
      }
    }

    const nLike = new this.likeModel({
      targetName,
      targetId,
      user: new ObjectId(userId),
      attitude: LikeAttitude.like,
      weight,
    });

    await nLike.save();

    await this.connection.model<ILikeable>(targetName).updateOne(
      { _id: new ObjectId(targetId) },
      { $inc: { 
        likeCount: weight,
          [`declareCounts.${LikeAttitude.like}`]: weight,
        },
      },
      { upsert: true },
    )

    this.eventEmitter.emit(
      LIKE_EVENT_KEYS.CREATED,
      {
        targetName,
        targetId,
        attitude: LikeAttitude.like,
        userId,
      },
    );
  }

  async dislikeBy(targetName: string, targetId: string, userId: string, weight: number = 1) {
    const modelNames = this.connection.modelNames()
    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    const target = await this.connection.model<ILikeable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    const like = await this.likeModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
      attitude: { $in: [LikeAttitude.like, LikeAttitude.dislike] }
    })

    if (like) {
      if (like.attitude === LikeAttitude.dislike) {
        throw new ConflictException('已经点过踩了')
      }

      if (like.attitude === undefined || like.attitude === LikeAttitude.like) {
        await this.cancelLikeBy(targetName, targetId, userId)
        await this.dislikeBy(targetName, targetId, userId, weight)
        return;
      }
    }

    const nLike = new this.likeModel({
      targetName,
      targetId,
      user: new ObjectId(userId),
      attitude: LikeAttitude.dislike,
      weight,
    });

    await nLike.save();

    await this.connection.model<ILikeable>(targetName).updateOne(
      { _id: new ObjectId(targetId) },
      { $inc: { 
          dislikeCount: weight,
          [`declareCounts.${LikeAttitude.dislike}`]: weight,
        },
      },
      { upsert: true },
    )

    this.eventEmitter.emit(
      LIKE_EVENT_KEYS.CREATED,
      {
        targetName,
        targetId,
        attitude: LikeAttitude.dislike,
        userId,
      },
    );
  }

  async cancelLikeBy(targetName: string, targetId: string, userId: string) {
    const modelNames = this.connection.modelNames()
    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    const target = await this.connection.model<ILikeable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    const like = await this.likeModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
      attitude: { $in: [LikeAttitude.like, LikeAttitude.dislike] }
    })

    if (!like) {
      throw new BadRequestException('还未点过赞')
    }

    if (like.attitude === LikeAttitude.dislike) {
      await this.connection.model<ILikeable>(targetName).updateOne(
        { _id: new ObjectId(targetId) },
        { $inc: { 
          dislikeCount: - (like.weight || 1),
          [`declareCounts.${like.attitude}`]: - (like.weight || 1),
        } },
        { upsert: true },
      )
    } else {
      await this.connection.model<ILikeable>(targetName).updateOne(
        { _id: new ObjectId(targetId) },
        { $inc: { 
          likeCount: - (like.weight || 1),
          [`declareCounts.${like.attitude}`]: - (like.weight || 1),
        } },
        { upsert: true },
      )
    }

    await this.likeModel.deleteOne({ _id: new ObjectId(like._id) });

    this.eventEmitter.emit(
      LIKE_EVENT_KEYS.CANCEL,
      {
        targetName,
        targetId,
        attitude: like.attitude,
        userId,
      },
    );
  }

  async getUserLikeIds(targetName: string, userId: string, attitude: LikeAttitude = LikeAttitude.like) {
    const result = await this.likeModel.find({ targetName, user: new ObjectId(userId), attitude })

    return result.map(r => r.targetId);
  }

  async getLikeableCtx(targetName: string, userId: string = ''): Promise<LikeableCtx> {
    if (!userId || userId === '') {
      return {
        userLikeIds: []
      }
    }

    return {
      userLikeIds: await this.getUserLikeIds(targetName, userId)
    }
  }

  async getdisLikeableCtx(targetName: string, userId: string = ''): Promise<disLikeableCtx> {
    if (!userId || userId === '') {
      return {
        userdisLikeIds: []
      }
    }

    return {
      userdisLikeIds: await this.getUserLikeIds(targetName, userId, LikeAttitude.dislike)
    }
  }

  async getUserDeclareMap(targetName: string, userId: string = '', targetIds?: Array<string>) {
    if (!userId || userId === '') {
      return {
        userDeclareMap: {}
      };
    }

    const query = { targetName, user: new ObjectId(userId) }
    if (targetIds) {
      Object.assign(query, {
        targetId: { $in: targetIds.map(id => new ObjectId(id)) }
      })
    }

    const result = await this.likeModel.find(query)
    const userDeclareMap = result.reduce((a, b) => ({
      ...a,
      [b.targetId]: [...(a[b.targetId] || []), b.attitude] 
    }), {})

    return {
      userDeclareMap
    }
  }
}
