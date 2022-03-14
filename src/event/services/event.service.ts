import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getObjectId } from '@app/utils';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Event as EventDocument } from '@app/event/schemas';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(EventDocument.name) public readonly eventModel: Model<EventDocument>,
  ) {
  }

  emitEvent(
    eventName: string,
    triggerType: string,
    triggerId: string,
    data?: Record<string, any>,
  ) {
    const nEvent = new this.eventModel({
      triggerId,
      triggerType,
      eventName,
      data,
    })

    return nEvent.save()
  }
}
