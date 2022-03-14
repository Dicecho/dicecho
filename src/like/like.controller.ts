import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserDecorator, serialize } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { DeclareSerializer } from '@app/like/serializers';
import { Public } from '@app/auth/decorators/public.decorator';
import { LikeService } from './like.service';
import { LikeDto, DeclareDto } from './dto/like.dto';

@Controller('like')
export class LikeController {
  constructor(
    private likeService: LikeService,
  ) {}

  @Get(':targetName/:targetId')
  @Public()
  async status(
    @Param('targetName') targetName: string,
    @Param('targetId') targetId: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<any> {
    const target = await this.likeService.getGenericObject(targetName, targetId);
    const ctx = {
      ...await this.likeService.getUserDeclareMap(targetName, user ? user._id.toString() : '', [targetId]),
      countKeys: { exclude: ['dislike'] },
    }

    return serialize(DeclareSerializer, target, ctx);
  }

  @Post('declare')
  async declare(
    @Body() declareDto: DeclareDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    const { targetName, targetId, attitude } = declareDto;
    const target = await this.likeService.declareBy(targetName, targetId, user._id.toString(), attitude);
    const ctx = {
      ...await this.likeService.getUserDeclareMap(targetName, user._id.toString(), [targetId]),
      countKeys: { exclude: ['dislike'] },
    }

    return serialize(DeclareSerializer, target, ctx);
  }

  @Post('declare/cancel')
  async cancelDeclare(
    @Body() declareDto: DeclareDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    const { targetName, targetId, attitude } = declareDto;
    const target = await this.likeService.cancelDeclareBy(targetName, targetId, user._id.toString(), attitude);

    const ctx = {
      ...await this.likeService.getUserDeclareMap(targetName, user._id.toString(), [targetId]),
      countKeys: { exclude: ['dislike'] },
    }

    return serialize(DeclareSerializer, target, ctx);
  }

  @Post()
  async like(
    @Body() likeDto: LikeDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.likeService.likeBy(likeDto.targetName, likeDto.targetId, user._id.toString());
  }

  @Post('dislike')
  async dislike(
    @Body() likeDto: LikeDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.likeService.dislikeBy(likeDto.targetName, likeDto.targetId, user._id.toString());
  }

  @Post('cancel')
  async cancel(
    @Body() likeDto: LikeDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.likeService.cancelLikeBy(likeDto.targetName, likeDto.targetId, user._id.toString());
  }
}
