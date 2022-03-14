import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Block as BlockDocument, BlockSchema } from './schemas';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: BlockDocument.name, schema: BlockSchema },
    ]),
  ],
  providers: [BlockService],
  controllers: [BlockController],
  exports: [
    BlockService,
  ],
})
export class BlockModule {}
