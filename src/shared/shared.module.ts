import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Config as ConfigDocument, ConfigSchema } from './config.schema';
import { ConfigController } from './config.controller';
import { SharedService } from './shared.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ConfigDocument.name, schema: ConfigSchema }]),
  ],
  controllers: [ConfigController],
  providers: [
    SharedService,
  ],
})

export class ShredModule {}
