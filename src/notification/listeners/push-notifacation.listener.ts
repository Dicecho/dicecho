import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'
import { OnEvent } from '@nestjs/event-emitter';
import { Rate as RateDocument } from '@app/rate/schemas';
import { INotificationCreatedEvent } from '@app/notification/events';
import { LikeCreatedEvent, LikeCancelEvent } from '@app/like/events';
import { ReportCreatedEvent } from '@app/report/events';

@Injectable()
export class PushNotifacationListener {
  constructor(
    // @InjectModel(RateDocument.name) public rateModel: Model<RateDocument>,
    // private rateService: RateService,
  ) {}
  private readonly logger = new Logger(PushNotifacationListener.name);

  @OnEvent('notification.created')
  async handleLikeEvent(event: INotificationCreatedEvent) {
    // console.log(event)
  }
}
