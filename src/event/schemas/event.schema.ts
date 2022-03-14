import { Types } from 'mongoose';
import { BaseDocument } from '@app/core';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Event extends BaseDocument {
  @Prop({ 
    type: String,
    required: true,
  })
  triggerId: string;

  @Prop({ 
    type: String,
    required: true,
  })
  triggerType: string;

  @Prop({ 
    type: String,
    required: true,
  })
  eventName: string;

  @Prop({
  })
  data: Record<string, any>;
}

const EventSchema = SchemaFactory.createForClass(Event);

export { EventSchema }
