import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification as NotificationDocument } from './schemas';
import { Model } from 'mongoose'
import { NotificationType } from './constants';
import { BlockService } from '@app/block/block.service';
import { BlockTargetName } from '@app/block/interface';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(NotificationDocument.name) public notificationModel: Model<NotificationDocument>,
    private eventEmitter: EventEmitter2,
    private blockService: BlockService,
  ) {}
  private readonly logger = new Logger(NotificationService.name);

  async createNotifications(values: {
    senderId: string,
    recipients: Array<string>,
    type: NotificationType,
    data: any,
  }) {
    const { senderId, recipients, type, data } = values;

    await this.notificationModel.insertMany(recipients.map((recipientId) => ({
      sender: new ObjectId(senderId),
      recipient: new ObjectId(recipientId),
      type,
      data,
    })))

    recipients.map((recipientId) => {
      this.eventEmitter.emit(
        'notification.created',
        {
          senderId,
          recipientId,
          type,
          data,
        },
      );
    })
  }

  async createNotification(values: {
    senderId: string,
    recipient: string,
    type: NotificationType,
    data: any,
  }) {
    const { senderId, recipient, type, data } = values;
    if (senderId === recipient) {
      return;
    }

    const blockUserIds = await this.blockService.getUserBlockIds(BlockTargetName.User, recipient)
    if (blockUserIds.length > 0 && blockUserIds.findIndex(id => id === senderId) !== -1) {
      return;
    }

    const notification = new this.notificationModel({
      sender: new ObjectId(senderId),
      recipient: new ObjectId(recipient),
      type,
      data,
    })

    await notification.save()
    this.eventEmitter.emit(
      'notification.created',
      {
        senderId,
        recipientId: recipient,
        type,
        data,
      },
    );
  }

}
