import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Block as BlockDocument } from './schemas';
import { ConflictException, BadRequestException } from '@app/core';
import { BlockTargetName } from './interface';

@Injectable()
export class BlockService {
  constructor(
    @InjectModel(BlockDocument.name) public readonly blockModel: Model<BlockDocument>,
  ) {}

  async blockBy(targetName: BlockTargetName, targetId: string, userId: string) {
    const block = await this.blockModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
    })

    if (block) {
      throw new ConflictException('已经加入过黑名单了')
    }

    const nBlock = new this.blockModel({
      targetName,
      targetId,
      target: new ObjectId(targetId),
      user: new ObjectId(userId),
    });

    await nBlock.save();
  }

  async unBlockBy(targetName: BlockTargetName, targetId: string, userId: string) {
    const block = await this.blockModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
    })

    if (!block) {
      throw new BadRequestException('还未加入过黑名单')
    }
  
    await this.blockModel.deleteOne({ _id: new ObjectId(block._id) });
  }

  async getUserBlockIds(targetName: BlockTargetName, userId: string) {
    const result = await this.blockModel.find({ targetName, user: new ObjectId(userId) })

    return result.map(r => r.targetId);
  }
}
