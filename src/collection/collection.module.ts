import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection as CollectionDocument, CollectionSchema } from './schemas';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: CollectionDocument.name, schema: CollectionSchema },
    ]),
  ],
  providers: [CollectionService],
  controllers: [CollectionController],
  exports: [
    CollectionService,
  ],
})
export class CollectionModule {}
