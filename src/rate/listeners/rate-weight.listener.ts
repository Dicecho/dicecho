import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { getObjectId } from '@app/utils';
import { Rate as RateDocument } from '@app/rate/schemas';
import { LikeAttitude } from '@app/like/schemas';
import { LikeCreatedEvent, LikeCancelEvent } from '@app/like/events';
import { ReportCreatedEvent } from '@app/report/events';
import { RateService } from '../rate.service';

const SensetiveLikeAttitude = {
  [LikeAttitude.dislike]: true,
  [LikeAttitude.like]: true,
};

@Injectable()
export class RateWeightUpdatedListener {
  constructor(
    @InjectModel(RateDocument.name) public rateModel: Model<RateDocument>,
    private rateService: RateService,
  ) {}
  private readonly logger = new Logger(RateWeightUpdatedListener.name);

  async reCalculateWeight(rateId: string) {
    const rate = await this.rateModel.findById(rateId);
    rate.wilsonScore = this.rateService.calculateWilsonScore(rate);
    rate.weight = this.rateService.calculateWeight(rate);
    rate.save();

    await this.rateService.calculateWeightedRate(
      getObjectId(rate.mod).toHexString(),
    );
  }

  @OnEvent('like.created')
  async handleLikeEvent(event: LikeCreatedEvent) {
    if (event.targetName !== 'Rate') {
      return;
    }

    if (!SensetiveLikeAttitude[event.attitude]) {
      return;
    }

    await this.reCalculateWeight(event.targetId);
  }

  @OnEvent('like.cancel')
  async handleCancelLikeEvent(event: LikeCancelEvent) {
    if (event.targetName !== 'Rate') {
      return;
    }

    if (!SensetiveLikeAttitude[event.attitude]) {
      return;
    }

    await this.reCalculateWeight(event.targetId);
  }

  @OnEvent('report.created')
  async handleReportEvent(event: ReportCreatedEvent) {
    if (event.targetName !== 'Rate') {
      return;
    }

    await this.reCalculateWeight(event.targetId);
  }
}
