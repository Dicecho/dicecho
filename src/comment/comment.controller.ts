import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { UserDecorator, serialize, NotFoundException, ForbiddenException } from '@app/core';
import { ObjectId } from 'mongodb';
import { PaginatedResponse } from '@app/interfaces/shared/api';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { CommentService } from './comment.service';
import { Public } from '@app/auth/decorators/public.decorator';
import { CommentDto, CommentQueryDto } from './dto';
import { CommentSerializer } from './serializers';
import { LikeService } from '@app/like/like.service';
import { BlockService } from '@app/block/block.service';
import { BlockTargetName } from '@app/block/interface';

@Controller('comment')
export class CommentController {
  constructor(
    private commentService: CommentService,
    private blockService: BlockService,
    private likeService: LikeService,
  ) {}

  @Get(':commentId/replies')
  @Public()
  async replies(
    @Param('commentId') commentId: string,
    @Query() query: CommentQueryDto,
    @UserDecorator() user?: UserDocument,
  ): Promise<PaginatedResponse<any>> {
    const { pageSize, page } = query;
    const filter = {
      isDeleted: { $ne: true },
      parent: new ObjectId(commentId)
    }

    if (user) {
      const blockUserIds = await this.blockService.getUserBlockIds(BlockTargetName.User, user._id.toHexString())
      if (blockUserIds.length > 0) {
        Object.assign(filter, {
          user: { $nin: blockUserIds.map(id => new ObjectId(id)) },
        })
      }
    }

    const result = await this.commentService.commentModel
      .find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate('user')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'user',
        } 
      })

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    const ctx = {
      user,
      ...await this.likeService.getLikeableCtx('Comment', user ? user._id.toString() : ''),
      isReply: true,
    }

    return {
      totalCount: await this.commentService.commentModel.countDocuments(filter),
      page,
      pageSize,
      data: serialize(CommentSerializer, returnData, ctx) as any,
      hasNext,
    };
  }

  @Get(':commentId/dialog')
  @Public()
  async dialog(
    @Param('commentId') commentId: string,
    @UserDecorator() user?: UserDocument,
  ) {
    let comment = await this.commentService.commentModel.findById(commentId)
      .populate('user')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'user',
        } 
      })

    if (!comment) {
      throw new NotFoundException('未找到评论')
    }

    const replyComments = []

    while (comment) {
      replyComments.unshift(comment)
      if (!comment.replyTo) {
        break;
      }
  
      comment = await this.commentService.commentModel.findById(comment.replyTo)
        .populate('user')
        .populate({
          path: 'replyTo',
          populate: {
            path: 'user',
          } 
        })
    }

    if (comment.parent) {
      const parent = await this.commentService.commentModel.findById(comment.parent)
        .populate('user')

      replyComments.unshift(parent)
    }

    const ctx = {
      user,
      ...await this.likeService.getLikeableCtx('Comment', user._id.toString()),
      isReply: true,
    }

    return serialize(CommentSerializer, replyComments, ctx)
  }

  @Get(':targetName/:targetId')
  @Public()
  async list(
    @Param('targetName') targetName: string,
    @Param('targetId') targetId: string,
    @Query() query: CommentQueryDto,
    @UserDecorator() user?: UserDocument,
  ): Promise<PaginatedResponse<any>> {
    const { pageSize, page, sort } = query;

    const filter = {
      targetName,
      targetId,
      $or: [{ isDeleted: { $ne: true } }, { repliesCount: { $gt: 0 } }],
      parent: { $exists: false },
    }
  
    const repliesQuery = {
      isDeleted: { $ne: true },
    }

    if (user) {
      const blockUserIds = await this.blockService.getUserBlockIds(BlockTargetName.User, user._id.toHexString())
      if (blockUserIds.length > 0) {
        Object.assign(filter, {
          user: { $nin: blockUserIds.map(id => new ObjectId(id)) },
        })

        Object.assign(repliesQuery, {
          user: { $nin: blockUserIds.map(id => new ObjectId(id)) },
        })
      }
    }


    const result = await this.commentService.commentModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate({
        path: 'replies',
        perDocumentLimit: 3,
        match: repliesQuery,
      });

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    const ctx = {
      user,
      ...await this.likeService.getLikeableCtx('Comment', user ? user._id.toString() : ''),
    }

    return {
      totalCount: await this.commentService.commentModel.countDocuments(filter),
      page,
      pageSize,
      data: serialize(CommentSerializer, returnData, ctx) as any,
      hasNext,
    };
  }

  @Post(':commentId/reply')
  async reply(
    @Param('commentId') commentId: string,
    @Body() commentDto: CommentDto,
    @UserDecorator() user: UserDocument,
  ) {
    const nComment = await this.commentService.replyTo({
      commentId,
      userId: user._id.toString(),
      content: commentDto.content,
    })

    const result = await this.commentService.commentModel.findById(nComment._id)
      .populate('user')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'user',
        } 
      })

    const ctx = {
      user,
      ...await this.likeService.getLikeableCtx('Comment', user._id.toString()),
      isReply: true,
    }

    return serialize(CommentSerializer, result, ctx);
  }

  @Post(':targetName/:targetId')
  async comment(
    @Param('targetName') targetName: string,
    @Param('targetId') targetId: string,
    @Body() commentDto: CommentDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    const nComment = await this.commentService.commentBy(
      targetName,
      targetId,
      user._id.toString(),
      commentDto.content,
    );

    const result = await this.commentService.commentModel.findById(nComment._id)
      .populate('user')

    const ctx = {
      user,
      ...await this.likeService.getLikeableCtx('Comment', user._id.toString()),
    }
  
    return serialize(CommentSerializer, result, ctx);
  }

  @Delete(':uuid')
  async delete(
    @Param('uuid') uuid: string,
    @UserDecorator() user: UserDocument,
  ) {
    const comment = await this.commentService.commentModel.findById(uuid)
      .populate('user')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'user',
        } 
      })

    if (!comment) {
      throw new NotFoundException('未找到评论')
    }
  
    if (comment.isDeleted) {
      throw new NotFoundException('此评论已被删除')
    }

    if (!this.commentService.checkCommentEditPermission(comment, user)) {
      throw new ForbiddenException('您没有权限删除此帖')
    }

    await this.commentService.deleteComment(comment)
  }
}
