import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { IReportable, Report as ReportDocument, Appeal as AppealDocument } from './schemas';
import { NotFoundException, ConflictException } from '@app/core';
import { ReportableCtx } from './serializers';
import { ReportClassification, REPORT_CLASSIFICATION_MAP, AppealStatus } from './constants';
import crypto from "crypto";

const NotMainReasonList = {
  [ReportClassification.Spoiler]: 1, 
  [ReportClassification.Invalid]: 1,
}

@Injectable()
export class ReportService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(ReportDocument.name) public readonly reportModel: Model<ReportDocument>,
    @InjectModel(AppealDocument.name) public readonly appealModel: Model<AppealDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async reportBy(targetName: string, targetId: string, userId: string, classification: ReportClassification, reason: string = '') {
    const modelNames = this.connection.modelNames()
    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    const target = await this.connection.model<IReportable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    const report = await this.reportModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
      targetReportedCode: target.reportedCode,
    })

    if (report) {
      throw new ConflictException('已经举报过此对象了')
    }

    const reportedCode = target.reportedCode || crypto.randomBytes(20).toString("hex");

    const nReport = new this.reportModel({
      targetName,
      targetId,
      user: new ObjectId(userId),
      classification,
      targetReportedCode: reportedCode,
      reason,
    });

    await nReport.save();

    const reportedReason = await this.getTargetReportReason(targetName, targetId)

    await this.connection.model<IReportable>(targetName).updateOne(
      { _id: new ObjectId(targetId) },
      { 
        $inc: { reportedCount: 1 },
        reportedCode,
        reportedReason,
      },
      { upsert: true },
    )

    this.eventEmitter.emit(
      'report.created',
      {
        targetName,
        targetId,
        classification,
        userId,
      },
    );
  }

  async getTargetReportReason(targetName: string, targetId: string) {
    const result = await this.reportModel.find({ targetName, targetId })
    // console.log(result)
    if (result.length === 0) {
      return '';
    }
    if (result.length === 1) {
      return result[0].classification;
    }

    const classifications = result
      .map((report) => report.classification)
      .filter((k) => NotMainReasonList[k] !== 1)
      .reduce(((a, b) => ({ ...a, [b]: a[b] ?  a[b] + 1 : 1 })), {})

    const reason = Object.keys(classifications).sort((a, b) => classifications[b] - classifications[a])[0]

    return REPORT_CLASSIFICATION_MAP[reason];
  }

  async getUserReportIds(targetName: string, userId: string) {
    const result = await this.reportModel.find({ targetName, user: new ObjectId(userId) })

    return result.map(r => r.targetId);
  }

  async getReportableCtx(targetName: string, userId: string = ''): Promise<ReportableCtx> {
    if (!userId || userId === '') {
      return {
        userReportIds: []
      }
    }

    return {
      userReportIds: await this.getUserReportIds(targetName, userId)
    }
  }

  async appealBy(targetName: string, targetId: string, userId: string, reason: string) {
    const modelNames = this.connection.modelNames()
    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    const target = await this.connection.model<IReportable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    const appeal = await this.appealModel.findOne({
      targetName,
      targetId,
      user: new ObjectId(userId),
      status: AppealStatus.Pending,
    })

    if (appeal) {
      throw new ConflictException(`此申诉正在处理中，请耐心等候，如果很久没有回应请使用'联系我们'来快速反馈`)
    }
  
    const nAppeal = new this.appealModel({
      targetName,
      targetId,
      user: new ObjectId(userId),
      reason,
    });

    await nAppeal.save();
  }
}
