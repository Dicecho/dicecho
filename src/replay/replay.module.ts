import { FileModule } from '@app/file/file.module';
import { Mod as ModDocument, ModSchema } from '@app/mod/schemas';
import { HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';
import { Replay as ReplayDocument, ReplaySchema } from './schemas';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15 * 1000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: ReplayDocument.name, schema: ReplaySchema },
      { name: ModDocument.name, schema: ModSchema },
    ]),
    FileModule,
  ],
  providers: [ReplayService],
  controllers: [ReplayController],
  exports: [ReplayService],
})
export class ReplayModule {}
