import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { 
  Topic as TopicDocument, TopicSchema, 
  Domain as DomainDocument, DomainSchema,
  DomainCategory as DomainCategoryDocument, DomainCategorySchema,
  DomainMember as DomainMemberDocument, DomainMemberSchema,
} from './schemas';
import { LikeModule } from '@app/like/like.module';
import { ModModule } from '@app/mod/mod.module';
import { DomainService } from './domain.service';
import { ForumService } from './forum.service';
import { DomainController } from './domain.controller';
import { BlockModule } from '@app/block/block.module';
import { TopicController } from './topic.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: TopicDocument.name, schema: TopicSchema },
      { name: DomainDocument.name, schema: DomainSchema },
      { name: DomainCategoryDocument.name, schema: DomainCategorySchema },
      { name: DomainMemberDocument.name, schema: DomainMemberSchema },
    ]),
    LikeModule,
    ModModule,
    BlockModule,
  ],
  providers: [
    ForumService,
    DomainService,
  ],
  controllers: [
    DomainController,
    TopicController,
  ],
  exports: [
    ForumService,
    DomainService,
  ],
})
export class ForumModule {}
