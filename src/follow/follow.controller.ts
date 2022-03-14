import { Controller, Get, Post, Body, Delete } from '@nestjs/common';
import { UserDecorator } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { FollowService } from './follow.service';
import { FollowDto } from './dto/follow.dto';

@Controller('follow')
export class FollowController {
  constructor(
    private followService: FollowService,
  ) {}

  @Post()
  async follow(
    @Body() followDto: FollowDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.followService.followBy(followDto.targetName, followDto.targetId, user._id.toString());
  }

  @Post('cancel')
  async unfollow(
    @Body() followDto: FollowDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.followService.unFollowBy(followDto.targetName, followDto.targetId, user._id.toString());
  }
}
