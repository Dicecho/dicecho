import { Module } from '@nestjs/common';
import { RichtextService } from './richtext.service';

@Module({
  providers: [RichtextService],
  exports: [
    RichtextService,
  ],
})
export class RichtextModule {}
