import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getObjectId } from '@app/utils';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { User as UserDocument, Pendant as PendantDocument } from '@app/users/schemas';

@Injectable()
export class PendantService {
  constructor(
    @InjectModel(UserDocument.name) public readonly userModel: Model<UserDocument>,
    @InjectModel(PendantDocument.name) public readonly pendantModel: Model<PendantDocument>,
  ) {
  }

  async createPendant(
    name: string,
    url: string,
  ) {
    const nPendant = new this.pendantModel({
      name,
      url,
    })
    await nPendant.save();

    return nPendant;
  }

  async sendPendants(
    userId: ObjectId,
    pendantIds: Array<ObjectId>,
  ) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $addToSet: { 
          pendants: { $each: pendantIds },
        },
      },
      { upsert: true },
    )
  }

  async activePendant(
    user: UserDocument,
    pendant: PendantDocument,
  ) {
    if (!user.pendants) {
      throw new Error('未找到对应的装饰')
    }

    const pendantIds = (user.pendants as Array<any>).map(getObjectId)
    const index = pendantIds.findIndex(id => id.equals(pendant._id))

    if (index === -1) {
      throw new Error('未找到对应的装饰')
    }
    
    user.activePendant = pendant._id;
    await user.save();
    return user;
  }

  async inactivePendant(userId: ObjectId) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $unset: { activePendant: '' },
      },
      { upsert: true },
    )
  }
}
