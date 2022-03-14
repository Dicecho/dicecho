import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { Roles } from '@app/auth/decorators';
import { Role } from '@app/auth/roles.enum';
import { OperationLogService } from '@app/operationLog/services'
import { ObjectId } from 'mongodb';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { LikeService } from '@app/like/like.service';
import { ReportService } from '@app/report/report.service';
import { BlockService } from '@app/block/block.service';
import { 
  UserDecorator,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  serialize,
} from '@app/core';
import { ReportClassification } from '@app/report/constants';
import { PostRateDto, UpdateRateDto, RateListQuery, HiddenRateDto } from '@app/rate/dto';
import { RateSerializer, RateSerializerCtx } from '@app/rate/serializers/rate.serializer';
import { RateService } from '@app/rate/rate.service';
import { ModService } from '@app/mod/services/mod.service';
import {
  IRateListQuery,
  IRateDto,
  IRateListApiResponse,
} from '@app/interfaces/shared/api';
import { BlockTargetName } from '@app/block/interface';
import { getObjectId } from '@app/utils';
import { RateType, AccessLevel } from './constants';
import { Public } from '@app/auth/decorators/public.decorator';

@Controller('rate')
export class RateController {
  constructor(
    private modService: ModService,
    private rateService: RateService,
    private likeService: LikeService,
    private reportService: ReportService,
    private blockService: BlockService,
    private operationLogService: OperationLogService,
    // private usersService: UsersService,
  ) {}

  @Get(':uuid')
  @Public()
  async retrieve(
    @Param('uuid') uuid: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<IRateDto> {
    const result = await this.rateService.rateModel.findById(uuid)
      .populate('user')
      .populate('mod');


    const ctx: Partial<RateSerializerCtx> = {
      ...await this.likeService.getLikeableCtx('Rate', user ? user._id.toString() : ''),
      ...await this.likeService.getdisLikeableCtx('Rate', user ? user._id.toString() : ''),
      ...await this.likeService.getUserDeclareMap('Rate', user ? user._id.toString() : '', [uuid]),
      countKeys: { exclude: ['dislike'] },
      user,
    }

    return serialize(RateSerializer, result, ctx) as IRateDto;
  }

  @Get()
  @Public()
  async list(
    @Query() query: RateListQuery,
    @UserDecorator() user?: UserDocument,
  ): Promise<IRateListApiResponse> {
    const { pageSize, page, sort, modId, userId, filter } = query;

    const filterQuery = await (async () => {
      const query = {
        $and: [],
      }

      query.$and.push({
        isDeleted: false,
      })

      if (filter) {
        query.$and.push(filter)
      }

      if (modId !== undefined) {
        const mod = await this.modService.getMod(modId)

        query.$and.push({ mod: mod ? mod._id : null });
      }

      if (userId !== undefined) {
        const userQuery = { user: new ObjectId(userId) }
        if (!user || (!user._id.equals(userId)) ) {
          Object.assign(userQuery, { isAnonymous: false });
        }

        query.$and.push(userQuery);
      }

      if (user) {
        const blockdRateIds = await this.blockService.getUserBlockIds(BlockTargetName.Rate, user._id.toHexString())
        const blockedUserIds = await this.blockService.getUserBlockIds(BlockTargetName.User, user._id.toHexString())
        const blockedModIds = await this.blockService.getUserBlockIds(BlockTargetName.Mod, user._id.toHexString())
        if (blockdRateIds.length > 0) {
          query.$and.push({
            _id: { $nin: blockdRateIds.map(id => new ObjectId(id)) }
          })
        }
        if (blockedUserIds.length > 0) {
          query.$and.push({
            $or: [
              { user: { $nin: blockedUserIds.map(id => new ObjectId(id)) } },
              { isAnonymous: true },
            ]
          })
        }
        if (blockedModIds.length > 0) {
          query.$and.push({
            mod: { $nin: blockedModIds.map(id => new ObjectId(id)) }
          })
        }
      }

      return query;
    })();

    const result = await this.rateService.rateModel
      .find(filterQuery)
      .sort(sort)
      .populate('user')
      .populate('mod')
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1);

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    const ctx = {
      ...await this.likeService.getLikeableCtx('Rate', user ? user._id.toString() : '' ),
      ...await this.likeService.getdisLikeableCtx('Rate', user ? user._id.toString() : '' ),
      ...await this.likeService.getUserDeclareMap(
          'Rate',
          user ? user._id.toString() : '',
          returnData.map(r => r._id.toHexString())
        ),
      countKeys: { exclude: ['dislike'] },
      user,
    }

    return {
      totalCount: await this.rateService.rateModel.countDocuments(filterQuery),
      page,
      pageSize,
      data: serialize(RateSerializer, returnData, ctx) as Array<IRateDto>,
      hasNext,
    };
  }

  @Post('mod/:modId')
  async postModRate(
    @UserDecorator() user: UserDocument,
    @Param('modId') modId: string,
    @Body() postRateDto: PostRateDto,
  ): Promise<IRateDto> {
    const rate = await this.rateService.createRate(modId, user, postRateDto);
    const newRate = await this.rateService.rateModel.findById(rate._id).populate('user').populate('mod');

    const ctx = {
      user,
    }
  
    return serialize(RateSerializer, newRate, ctx) as IRateDto
  }

  @Put(':rateId')
  async updateRate(
    @UserDecorator() user: UserDocument,
    @Param('rateId') rateId: string,
    @Body() updateRateDto: UpdateRateDto,
  ): Promise<any> {
    const rate = await this.rateService.rateModel.findById(rateId);
    if (!rate) {
      throw new NotFoundException('未发现指定评价');
    }

    this.rateService.checkRateManagePermission(rate, user);
    this.rateService.checkRateCanUpdate(rate, user, updateRateDto);
    await this.rateService.createUpdateLog(rate, user, updateRateDto);
    await this.rateService.updateRate(rate, updateRateDto);

    const newRate = await this.rateService.rateModel.findById(rate._id).populate('user').populate('mod');
    const ctx = {
      ...await this.likeService.getLikeableCtx('Rate', user._id.toString()),
      ...await this.likeService.getdisLikeableCtx('Rate', user._id.toString()),
      ...await this.likeService.getUserDeclareMap('Rate', user._id.toString(), [rateId]),
      countKeys: { exclude: ['dislike'] },
      user,
    }
    
    return serialize(RateSerializer, newRate, ctx) as IRateDto
  }

  @Post(':rateId/reportSpoiler')
  async reportSpoiler(
    @UserDecorator() user: UserDocument,
    @Param('rateId') rateId: string,
  ): Promise<any> {
    const rate = await this.rateService.rateModel.findById(rateId);
    if (!rate) {
      throw new NotFoundException('未发现指定评价');
    }

    const report = await this.reportService.reportModel.find({
      targetName: 'Rate',
      targetId: rateId,
      classification: ReportClassification.Spoiler,
      user: user._id,
    })
  
    const nReport = new this.reportService.reportModel({
      targetName: 'Rate',
      targetId: rateId,
      user: user._id,
      classification: ReportClassification.Spoiler,
      reason: '剧透',
    });

    await nReport.save();

    if (report.length > 0) {
      throw new ConflictException('您已经警告过此评价了')
    }

    let weight = 1;

    if (user.checkRole('staff')) {
      weight = 2;
    }

    await this.rateService.rateModel.updateOne(
      { _id: rate._id },
      { $inc: { spoilerCount: weight } },
      { upsert: true },
    )
    
    const newRate = await this.rateService.rateModel.findById(rate._id).populate('user').populate('mod');
    const ctx = {
      ...await this.likeService.getLikeableCtx('Rate', user._id.toString()),
      ...await this.likeService.getdisLikeableCtx('Rate', user._id.toString()),
      ...await this.likeService.getUserDeclareMap('Rate', user._id.toString(), [rateId]),
      countKeys: { exclude: ['dislike'] },
      user,
    }

    return serialize(RateSerializer, newRate, ctx) as IRateDto
  }

  @Roles(Role.Admin)
  @Post(':rateId/hide')
  async hidden(
    @UserDecorator() user: UserDocument,
    @Param('rateId') rateId: string,
    @Body() hiddenRateDto: HiddenRateDto,
  ) {
    const rate = await this.rateService.rateModel.findById(rateId);
    if (!rate) {
      throw new NotFoundException('未发现指定评价');
    }

    if (rate.accessLevel !== AccessLevel.Public) {
      throw new NotFoundException('此评价并未公开，无法隐藏');
    }

    await this.rateService.hiddenRate(rate);
    await this.operationLogService.createAdminLog(
      {
        log: hiddenRateDto.log,
        message: hiddenRateDto.message,
        type: 'hide-rate',
        snapshot: {
          nickname: rate.isAnonymous ? '匿名用户' : rate.user instanceof ObjectId ? '**' : rate.user.nickName[0] + '**' + rate.user.nickName[rate.user.nickName.length - 1],
          rate: rate.rate,
          remark: rate.remark,
        }
      },
      user,
    )
  }

  @Delete(':rateId')
  async delete(
    @Param('rateId') rateId: string,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    const rate = await this.rateService.rateModel.findById(rateId);
    if (!rate) {
      throw new NotFoundException('未发现指定评价');
    }

    if (!getObjectId(rate.user).equals(user._id)) {
      throw new ForbiddenException('无法删除其他人的评价哦');
    }

    await this.rateService.rateModel.updateOne(
      { _id: rate._id },
      { isDeleted: true },
      { upsert: true },
    )

    const mod = await this.modService.modModel.findById(rate.mod);  
    await Promise.all([
      this.rateService.calculateModRateInfo(mod._id.toString()),
      this.rateService.calculateWeightedRate(mod._id.toString()),
    ])
  }
}
