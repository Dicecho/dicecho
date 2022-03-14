import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'
import { ObjectId } from 'mongodb';
import { getObjectId, wilsonScore } from '@app/utils';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Mod as ModDocument } from '@app/mod/schemas';
import { Rate as RateDocument } from '@app/rate/schemas';
import { RichtextService } from '@app/richtext/richtext.service';
import { RemarkType, RemarkTypeWeightMap, RateType, AccessLevel, RemarkContentType } from './constants';
import { PostRateDto, UpdateRateDto } from './dto';
import { OperationLogService } from '@app/operationLog/services'
import _ from 'lodash';


@Injectable()
export class RateService {
  constructor(
    @InjectModel(RateDocument.name) public rateModel: Model<RateDocument>,
    @InjectModel(ModDocument.name) public modModel: Model<ModDocument>,
    private operationLogService: OperationLogService,
    private richtextService: RichtextService,
  ) {}
  private readonly logger = new Logger(RateService.name);

  async checkRateManagePermission(rate: RateDocument, user?: UserDocument) {
    if (!user) {
      throw new ForbiddenException('无法管理此评价')
    }

    if (user.checkRole('superuser') || user.checkRole('staff')) {
      return true;
    }

    if (!getObjectId(rate.user).equals(user._id)) {
      throw new ForbiddenException('无法管理此评价')
    }
  }

  async createRate(modId: string, user: UserDocument, postRateDto: PostRateDto) {
    const mod = await this.modModel.findById(modId);
    if (!mod) {
      throw new NotFoundException('未发现指定模组');
    }

    const newRate = await (async () => {
      const checkRated = await this.rateModel.findOne({
        mod: mod._id,
        user: user._id,
      });

      const remarkLength = (() => {
        if (postRateDto.remarkType === RemarkContentType.Richtext) {
          return postRateDto.richTextState ? this.richtextService.serializeToText(JSON.parse(postRateDto.richTextState)).length : 0;
        }

        return postRateDto.remark ? postRateDto.remark.length : 0;
      })()
    
      if (!checkRated) {
        const rate = new this.rateModel({
          user: user._id,
          mod: mod._id,
          rate: postRateDto.rate ? postRateDto.rate : 0,
          type: postRateDto.type,
          remark: postRateDto.remark,
          remarkType: postRateDto.remarkType,
          richTextState: postRateDto.richTextState ? JSON.parse(postRateDto.richTextState) : [],
          remarkLength,
          isAnonymous: postRateDto.isAnonymous,
          view: postRateDto.view,
          accessLevel: postRateDto.accessLevel,
        });
        rate.wilsonScore = this.calculateWilsonScore(rate);
        rate.weight = this.calculateWeight(rate);
    
        await rate.save();
        return rate;
      }

      if (!checkRated.isDeleted) {
        throw new ConflictException('已经为此模组评过分');
      }

      if (checkRated.isLocked && postRateDto.accessLevel === AccessLevel.Public) {
        throw new ConflictException('被锁定的评价无法改变公开状态');
      }

      checkRated.rate = postRateDto.rate ? postRateDto.rate : 0;
      checkRated.remark = postRateDto.remark;
      checkRated.type = postRateDto.type;
      checkRated.remarkType = postRateDto.remarkType;
      if (postRateDto.richTextState) {
        checkRated.richTextState = JSON.parse(postRateDto.richTextState);
      }
      checkRated.remarkLength = remarkLength;
      checkRated.isAnonymous = postRateDto.isAnonymous;
      checkRated.view = postRateDto.view;
      checkRated.wilsonScore = this.calculateWilsonScore(checkRated);
      checkRated.weight = this.calculateWeight(checkRated);
      checkRated.accessLevel = postRateDto.accessLevel;

      if (checkRated.isDeleted) {
        checkRated.isDeleted = false;
        checkRated.rateAt = new Date();
      }

      if (checkRated.type !== postRateDto.type && postRateDto.type === RateType.Rate) {
        checkRated.rateAt = new Date();
      }

      await checkRated.save();
      return checkRated;
    })()

    await this.calculateWeightedRate(mod._id.toString());

    if (newRate.type === RateType.Rate && newRate.accessLevel === AccessLevel.Public) {
      await this.modModel.updateOne(
        { _id: mod._id },
        { 
          lastRateAt: new Date(),
          $inc: {
            [`rateInfo.${newRate.rate}`]: 1,
          },
        },
        { upsert: true }
      );
    }

    return newRate;
  }

  async checkRateCanUpdate(rate: RateDocument, user: UserDocument, updateRateDto: Partial<UpdateRateDto>) {
    if (user.checkRole('superuser') || user.checkRole('staff')) {
      return true;
    }

    if (rate.isLocked && updateRateDto.accessLevel === AccessLevel.Public) {
      throw new BadRequestException('被锁定的评价无法改变公开状态')
    }
  }

  async createUpdateLog(rate: RateDocument, user: UserDocument, updateRateDto: Partial<UpdateRateDto>) {
    const updateData = _(updateRateDto).omitBy(_.isNil).omitBy(_.isEmpty).value();
    const changedKeys = Object.keys(updateData)
      .map((key) => ({ key, value: !_.isEqual(updateData[key], rate[key]) }))
      .reduce((a, b) => b.value ? [...a, b.key] : a, []) as string[]
    
    const before = _(rate).pick(changedKeys).value();
    const after = _(updateData).pick(changedKeys).value();

    const log = await this.operationLogService.createOperationLog(
      {
        targetName: 'Rate',
        targetId: rate._id.toHexString(),
        changedKeys,
        before,
        after,
      }, 
      user,
    )

    return log
  }

  async updateRate(rate: RateDocument, updateRateDto: Partial<UpdateRateDto>) {
    const updateData =  _.omit(updateRateDto, ['richTextState']);
    const typeChanged = updateData.type !== rate.type && updateData.type === RateType.Rate
    if (typeChanged) {
      Object.assign(updateData, {
        rateAt: new Date()
      })
    }

    if (typeChanged && updateData.accessLevel !== AccessLevel.Private) {
      await this.modModel.updateOne(
        { _id: getObjectId(rate.mod) },
        { lastRateAt: new Date() },
        { upsert: true }
      );
    }

    const newRemarkType = updateData.remarkType ? updateData.remarkType : rate.remarkType;

    if (newRemarkType === RemarkContentType.Markdown && updateData.remark) {
      Object.assign(updateData, {
        remarkLength: updateData.remark.length,
      })
    }

    if (newRemarkType === RemarkContentType.Richtext && updateRateDto.richTextState) {
      const richTextObj = JSON.parse(updateRateDto.richTextState)
      const text = this.richtextService.serializeToText(richTextObj);
      Object.assign(updateData, {
        remarkLength: text.length,
        richTextState: richTextObj,
      })
    }

    await this.rateModel.updateOne(
      { _id: rate._id },
      updateData,
      { upsert: true },
    )
    const nRate = await this.rateModel.findById(rate._id);
    nRate.wilsonScore = this.calculateWilsonScore(nRate);
    nRate.weight = this.calculateWeight(nRate);
    await nRate.save()

    const modId = rate.mod instanceof ObjectId ? rate.mod.toString() : rate.mod._id.toString()

    await Promise.all([
      this.calculateModRateInfo(modId),
      this.calculateWeightedRate(modId),
    ])

    return nRate;
  }

  async updateModWeightedRate() {
    const result = await this.rateModel.aggregate<{ 
      _id: ObjectId,
      weightedAvg: number,
      markCount: number,
      rateCount: number,
    }>([
      {
        $match: {
          isDeleted: false,
        }
      },
      {
        $group: {
          _id: '$mod',
          numerator: { $sum: { $multiply: [ '$weight', '$rate' ] } },
          denominator: { $sum: '$weight' },
          markCount: { 
            $sum: { $cond: [{ $eq: ['$type', RateType.Mark] }, 1, 0] },
          },
          rateCount: {
            $sum: { $cond: [{ $eq: ['$type', RateType.Rate] }, 1, 0] },
          },
        }
      },
      {
        $project: {
          weightedAvg: { $cond: [{ $eq: ['$denominator', 0] }, 0,  { $divide: ['$numerator', '$denominator'] }] },
          markCount: '$markCount',
          rateCount: '$rateCount',
        }
      },
    ])

    const opts = result.map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: { 
          rateAvg: r.weightedAvg,
          rateCount: r.rateCount,
          markCount: r.markCount,
        }
      }
    }))
    await this.modModel.bulkWrite(opts, { ordered: true, w: 1 })
  }

  async updateModRateInfo() {
    const result = await this.rateModel.aggregate<{ 
      _id: ObjectId,
      rateObjects: { [key: string]: number },
    }>([
      { $match: { 
          isDeleted: false, 
          rate: { $gt: 0 },
          type: RateType.Rate,
        }
      }, 
      { $group: { 
          _id: { 
            mod: '$mod', 
            rate: { $toString: '$rate' },
          },
          rateCount: {
            $sum: 1,
          },
        }
      },
      { $group: { _id: '$_id.mod', rates: { $push: { k: '$_id.rate', v: '$rateCount' } } } },
      { $set: { rateObjects: { $arrayToObject: '$rates' } } },
    ])

    const opts = result.map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: { rateInfo: r.rateObjects },
      }
    }))

    // console.log(result.length)
    // console.log(result.map(r => r._id))

    await this.modModel.bulkWrite(opts, { ordered: true, w: 1 })
  }

  async calculateModRateInfo(modId: string) {
    const result = await this.rateModel.aggregate<{ 
      _id: ObjectId,
      rateObjects: { [key: string]: number },
    }>([
      { $match: {
          type: RateType.Rate,
          rate: { $gt: 0 },
          mod: new ObjectId(modId),
          isDeleted: false,
          accessLevel: AccessLevel.Public,
        } 
      }, 
      { $group: { 
          _id: { 
            mod: '$mod', 
            rate: { $toString: '$rate' },
          },
          rateCount: {
            $sum: 1,
          },
        }
      },
      { $group: { _id: '$_id.mod', rates: { $push: { k: '$_id.rate', v: '$rateCount' } } } },
      { $set: { rateObjects: { $arrayToObject: '$rates' } } },
    ])
    
    if (result.length !== 1) {
      this.logger.debug(result);
      await this.modModel.updateOne(
        { _id: new ObjectId(modId) }, 
        { 
          $set: {
            rateInfo: {},
          } 
        },
      )
      return;
    }

    await this.modModel.updateOne(
      { _id: new ObjectId(modId) }, 
      { 
        $set: {
          rateInfo: result[0].rateObjects,
        } 
      },
    )

    // await this.modModel.bulkWrite(opts, { ordered: true, w: 1 })
  }

  async calculateWeightedRate(modId: string) {
    const result = await this.rateModel.aggregate<{ 
      _id: ObjectId,
      weightedAvg: number,
      count: number,
      markCount: number,
      rateCount: number,
      validRateCount: number,
    }>([
      {
        $match: {
          mod: new ObjectId(modId),
          isDeleted: false,
          accessLevel: AccessLevel.Public,
        }
      }, 
      {
        $group: {
          _id: '$mod',
          numerator: { $sum: { $multiply: [ '$weight', '$rate' ] } },
          denominator: { $sum: '$weight' },
          markCount: { 
            $sum: { $cond: [{ $eq: ['$type', RateType.Mark] }, 1, 0] },
          },
          rateCount: {
            $sum: { $cond: [{ $eq: ['$type', RateType.Rate] }, 1, 0] },
          },
          validRateCount: {
            $sum: { $cond: [{ $gt: ['$rate', 0] } , 1, 0] },
          },
          count: { 
            $sum: 1,
          }
        }
      },
      {
        $project: {
          weightedAvg: { $cond: [{ $eq: ['$denominator', 0] }, 0,  { $divide: ['$numerator', '$denominator'] }] },
          count: '$count',
          markCount: '$markCount',
          rateCount: '$rateCount',
          validRateCount: '$validRateCount',
        }
      },
    ])

    if (result.length !== 1) {
      this.logger.debug(result);
      await this.modModel.updateOne(
        { _id: new ObjectId(modId) }, 
        { 
          $set: {
            rateAvg: 0,
            rateCount: 0,
            markCount: 0,
            validRateCount: 0,
          } 
        },
      )
      return;
    }

    await this.modModel.updateOne(
      { _id: new ObjectId(modId) }, 
      { 
        $set: {
          rateAvg: result[0].weightedAvg,
          rateCount: result[0].rateCount,
          markCount: result[0].markCount,
          validRateCount: result[0].validRateCount,
        } 
      },
    )
  }

  async calculateUserLike() {
    const result = await this.rateModel.aggregate<{ 
      _id: ObjectId,
      likeCount: number,
    }>([
      {
        '$match': {
          'isDeleted': false
        }
      }, {
        '$group': {
          '_id': '$user', 
          'likeCount': {
            '$sum': '$likeCount'
          }
        }
      }, {
        '$sort': {
          'likeCount': -1
        }
      }, {
        '$match': {
          'likeCount': {
            '$gt': 0
          }
        }
      }
    ])

    // const opts = result.map((r) => ({
    //   updateOne: {
    //     filter: { _id: r._id },
    //     update: { 
    //       rateAvg: r.weightedAvg,
    //       rateCount: r.count,
    //     }
    //   }
    // }))
    // await this.modModel.bulkWrite(opts, { ordered: true, w: 1 })
  }

  async hiddenRate(rate: RateDocument) {
    rate.accessLevel = AccessLevel.Private;
    await rate.save()
  }

  getRemarkType(rate: RateDocument) {
    if(rate.remarkLength <= 1) {
      return RemarkType.Empty
    }

    if(rate.remarkLength <= 140) {
      return RemarkType.Short
    }

    return RemarkType.Long
  }

  calculateWilsonScore(rate: RateDocument) {
    const all = rate.likeCount + rate.dislikeCount
    return wilsonScore(rate.likeCount, all)
  }

  calculateWeight(rate: RateDocument) {
    if (rate.type === RateType.Mark) {
      return 0;
    }

    if (rate.rate === 0) {
      return 0;
    }

    return parseFloat((this.calculateWilsonScore(rate) * RemarkTypeWeightMap[this.getRemarkType(rate)]).toFixed(2))
  }
}