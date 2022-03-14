import { NotificationType } from '../constants';

export interface INotificationCreatedEvent {
  senderId: string,
  recipientId: string,
  type: NotificationType,
  data: any,
}