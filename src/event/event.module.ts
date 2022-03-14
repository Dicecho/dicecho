import { Module } from '@nestjs/common';
import { EventService } from './services';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema} from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [],
  providers: [EventService],
  exports: [EventService],
})

export class EventModule {}
