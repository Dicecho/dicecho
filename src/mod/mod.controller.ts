import { Roles } from '@app/auth/decorators';
import { Public } from '@app/auth/decorators/public.decorator';
import { Role } from '@app/auth/roles.enum';
import { BlockService } from '@app/block/block.service';
import { BlockTargetName } from '@app/block/interface';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  serialize,
  UserDecorator,
} from '@app/core';
import { PaginatedResponse } from '@app/interfaces/shared/api';
import {
  ContributeModDto,
  CreateModDto,
  IModDto,
  ModListQuery,
  TagFilterMode,
  UpdateModDto,
} from '@app/mod/dto';
import { ModSerializer } from '@app/mod/serializers';
import { ModService } from '@app/mod/services';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { getObjectId, getRandomInt } from '@app/utils';
import { getCountry } from '@app/utils/request';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { Request } from 'express';
import { ObjectId } from 'mongodb';

const TagFilterModeMap = {
  [TagFilterMode.ALL]: '$all',
  [TagFilterMode.IN]: '$in',
};

interface getQueryArgs {
  query: Partial<ModListQuery>;
  user?: UserDocument;
  clientCountry?: string;
}

@Controller('mod')
export class ModController {
  constructor(
    private blockService: BlockService,
    private modService: ModService,
  ) {}

  async getQuery(args: getQueryArgs) {
    const { query, user, clientCountry } = args;
    const {
      pageSize,
      page,
      sort,
      filter = {},
      keyword,
      ids,
      tags,
      origins,
      languages,
      tagsMode = TagFilterMode.ALL,
      minPlayer,
      maxPlayer,
    } = query;
    const { updatedAt = { $lt: new Date() }, ...innerFilter } = filter;

    const filterQuery = await (async () => {
      const result = {
        $and: [],
      };

      result.$and.push({ invalid: false });

      if (innerFilter) {
        result.$and.push(innerFilter);
      }

      if (ids && ids.length > 0) {
        result.$and.push({ _id: { $in: ids.map(id => new ObjectId(id)) } });
      }

      if (user) {
        const blockedUserIds = await this.blockService.getUserBlockIds(
          BlockTargetName.User,
          user._id.toHexString(),
        );
        const blockedModIds = await this.blockService.getUserBlockIds(
          BlockTargetName.Mod,
          user._id.toHexString(),
        );
        if (blockedModIds.length > 0) {
          result.$and.push({
            _id: { $nin: blockedModIds.map(id => new ObjectId(id)) },
          });
        }
        if (blockedUserIds.length > 0) {
          result.$and.push({
            author: { $nin: blockedModIds.map(id => new ObjectId(id)) },
          });
        }
      }

      if (
        sort &&
        Object.keys(sort).findIndex(key => key === 'rateAvg') !== -1
      ) {
        result.$and.push({
          $or: [
            { validRateCount: { $exists: false }, rateCount: { $gte: 5 } },
            { validRateCount: { $gte: 5 } },
          ],
        });
      }

      if (origins) {
        result.$and.push({
          origin: { $in: origins },
        });
      }

      if (languages) {
        result.$and.push({
          languages: { $all: languages },
        });
      }

      if (tags) {
        result.$and.push({
          tags: { [TagFilterModeMap[tagsMode]]: tags },
        });
      }

      if (updatedAt) {
        result.$and.push({
          updatedAt: Object.keys(updatedAt).reduce(
            (a, b) => ({ ...a, [b]: new Date(updatedAt[b]) }),
            {},
          ),
        });
      }

      if (minPlayer) {
        result.$and.push({
          'playerNumber.0': { $lte: minPlayer },
        });
      }

      if (maxPlayer) {
        result.$and.push({
          'playerNumber.1': { $gte: maxPlayer },
        });
      }

      return result;
    })();

    return filterQuery;
  }

  @Public()
  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: ModListQuery,
    @UserDecorator() user?: UserDocument,
  ): Promise<PaginatedResponse<IModDto>> {
    const clientCountry = getCountry(req);
    const { pageSize, page, sort, keyword } = query;

    if (keyword && keyword !== '') {
      const result = await this.modService.searchMod(
        query,
        user,
        clientCountry,
      );
      let modIds: Array<string> = result.body.hits.hits.map(item => item._id);

      const hasNext = modIds.length > pageSize;
      modIds =
        modIds.length === 1 || !hasNext
          ? modIds
          : modIds.slice(0, modIds.length - 1);

      const mod = await this.modService.modModel
        .find({
          _id: { $in: modIds.map(id => new ObjectId(id)) },
        })
        .populate('author');

      const resultMods = modIds.map(id =>
        mod.find(m => m._id.toString() === id),
      );

      return {
        totalCount: result.body.hits.total.value,
        page: page,
        pageSize: pageSize,
        data: serialize(ModSerializer, resultMods) as Array<IModDto>,
        hasNext,
      };
    }

    const filterQuery = await this.getQuery({ query, user, clientCountry });

    const result = await this.modService.modModel
      .find(filterQuery)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate('author');

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    return {
      totalCount: await this.modService.modModel.countDocuments(filterQuery),
      page,
      pageSize,
      data: serialize(ModSerializer, returnData) as Array<IModDto>,
      hasNext,
    };
  }

  @Public()
  @Get('config')
  async config() {
    const [rules, origins, languages] = await Promise.all([
      this.modService.getModRule(),
      this.modService.getModOrigin(),
      this.modService.getModLanguage(),
    ]);

    return { rules, origins, languages };
  }

  @Public()
  @Get('random')
  async random(
    @Req() req: Request,
    @Query() query: ModListQuery,
    @UserDecorator() user?: UserDocument,
  ): Promise<IModDto> {
    const clientCountry = getCountry(req);
    const filterQuery = await this.getQuery({ query, user, clientCountry });

    const count = await this.modService.modModel.countDocuments(filterQuery);
    if (count === 0) {
      throw new NotFoundException('此筛选条件下没有找到模组');
    }

    const randomIndex = getRandomInt(1, count);

    const result = await this.modService.modModel
      .find(filterQuery)
      .skip(randomIndex)
      .limit(1)
      .populate('author');

    return serialize(ModSerializer, result[0]) as IModDto;
  }

  @Public()
  @Get('hot')
  async hot(): Promise<PaginatedResponse<IModDto>> {
    const pageSize = 8;
    const modIds = (await this.modService.getHotModIds()).map(id =>
      id.toHexString(),
    );

    const modIdSortMap = modIds.reduce(
      (a, b, index) => ({ ...a, [b]: index }),
      {},
    );

    const mods = await this.modService.modModel
      .find({
        _id: { $in: modIds.map(id => new ObjectId(id)) },
        invalid: false,
      })
      .populate('author');

    const sortedMods = mods
      .map(mod =>
        Object.assign(mod, { hot: modIdSortMap[mod._id.toHexString()] }),
      )
      .sort((a, b) => a.hot - b.hot);

    const resultMods = sortedMods.slice(0, pageSize);

    return {
      totalCount: pageSize,
      page: 1,
      pageSize,
      data: serialize(ModSerializer, resultMods) as Array<IModDto>,
      hasNext: false,
    };
  }

  @Public()
  @Get(':uuidOrTitle/recommend')
  async recommend(@Param('uuidOrTitle') uuidOrTitle: string) {
    const pageSize = 8;
    const mod = await this.modService.getMod(uuidOrTitle);
    if (!mod || mod.invalid) {
      throw new NotFoundException('未找到指定模组');
    }

    const modIds = (await this.modService.getRecommendModIds(mod)).map(id =>
      id.toHexString(),
    );

    const modIdSortMap = modIds.reduce(
      (a, b, index) => ({ ...a, [b]: index }),
      {},
    );

    const mods = await this.modService.modModel
      .find({
        _id: { $in: modIds.map(id => new ObjectId(id)) },
        invalid: false,
      })
      .populate('author');

    const sortedMods = mods
      .map(mod =>
        Object.assign(mod, { hot: modIdSortMap[mod._id.toHexString()] }),
      )
      .sort((a, b) => a.hot - b.hot);

    const resultMods = sortedMods.slice(0, pageSize);

    return {
      totalCount: pageSize,
      page: 1,
      pageSize,
      data: serialize(ModSerializer, resultMods) as Array<IModDto>,
      hasNext: false,
    };
  }

  @Public()
  @Get(':uuidOrTitle/related')
  async related(
    @Param('uuidOrTitle') uuidOrTitle: string,
    @Req() req: Request,
    @UserDecorator() user?: UserDocument,
  ) {
    const mod = await this.modService.getMod(uuidOrTitle);
    if (!mod || mod.invalid) {
      throw new NotFoundException('未找到指定模组');
    }

    const clientCountry = getCountry(req);
    const query = await this.getQuery({ query: {}, user, clientCountry });

    if (!mod.author) {
      const result = await this.modService.modModel.find({
        ...query,
        'foreignAuthor.nickName': mod.foreignAuthor.nickName,
        _id: { $ne: mod._id },
      });
      return serialize(ModSerializer, result) as Array<IModDto>;
    }

    const result = await this.modService.modModel.find({
      ...query,
      author: getObjectId(mod.author),
      _id: { $ne: mod._id },
    });

    return serialize(ModSerializer, result) as Array<IModDto>;
  }

  @Public()
  @Get(':uuidOrTitle')
  async retrieve(
    @Req() req: Request,
    @Param('uuidOrTitle') uuidOrTitle: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<IModDto> {
    const result = await this.modService
      .getMod(uuidOrTitle)
      .populate('author')
      .populate('contributors');

    if (!result || !this.modService.checkModReadPermission(result)) {
      throw new NotFoundException('未找到指定模组');
    }

    const ctx = {
      user,
    };

    if (user !== undefined) {
      Object.assign(ctx, {
        userEditedIds: await this.modService.getEditModIds(user._id.toString()),
      });
    }

    return serialize(ModSerializer, result, ctx) as IModDto;
  }

  @Post(':uuidOrTitle/withdraw')
  async withdraw(
    @Param('uuidOrTitle') uuidOrTitle: string,
    @UserDecorator() user: UserDocument,
  ) {
    const result = await this.modService
      .getMod(uuidOrTitle)
      .populate('author')
      .populate('contributors');

    const author = result.author;

    if (!result || result.invalid || author instanceof ObjectId) {
      throw new NotFoundException('未找到指定模组');
    }

    if (result.isForeign || !getObjectId(result.author).equals(user._id)) {
      throw new ForbiddenException('只可以撤除自己的投稿哦');
    }

    await this.modService.withdrawMod(result, author);
  }

  @Post()
  async create(
    @Body() createModDto: CreateModDto,
    @UserDecorator() user: UserDocument,
  ) {
    const mod = await this.modService.modModel.findOne({
      title: createModDto.title,
      invalid: false,
    });

    if (mod) {
      throw new ConflictException('已有重名模组，请您考虑换个名字');
    }

    const nMod = await this.modService.createMod(user, createModDto);

    const ctx = {
      userEditedIds: await this.modService.getEditModIds(user._id.toString()),
      user,
    };

    const result = await this.modService.modModel
      .findById(nMod._id)
      .populate('author')
      .populate('contributors');

    return serialize(ModSerializer, result, ctx) as IModDto;
  }

  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() updateModDto: any,
    @UserDecorator() user: UserDocument,
  ): Promise<IModDto> {
    const mod = await this.modService.modModel
      .findById(uuid)
      .populate('author')
      .populate('contributors');
    const ctx = {
      userEditedIds: await this.modService.getEditModIds(user._id.toString()),
      user,
    };

    if (!mod || mod.invalid) {
      throw new NotFoundException('未找到指定模组');
    }

    if (!(await this.modService.checkEditPermission(user, mod))) {
      throw new ForbiddenException('您没有编辑权限');
    }

    const dto = mod.isForeign ? new ContributeModDto() : new UpdateModDto();

    Object.keys(updateModDto).map(key => {
      dto[key] = updateModDto[key];
    });

    const errors = await validate(dto);
    errors.map(err => {
      Object.keys(err.constraints).map(key => {
        throw new BadRequestException(err.constraints[key]);
      });
    });

    const nMod = await this.modService.updateMod(user, mod, dto);

    return serialize(ModSerializer, nMod, ctx) as IModDto;
  }

  @Public()
  @Put(':uuid/link/:linkName/click')
  async clickLink(
    @Param('uuid') uuid: string,
    @Param('linkName') linkName: string,
  ) {
    const mod = await this.modService.modModel.findById(uuid);

    if (!mod || mod.invalid) {
      throw new NotFoundException('未找到指定模组');
    }

    await this.modService.modModel.updateOne(
      {
        _id: mod._id,
        relatedLinks: { $elemMatch: { name: linkName } },
      },
      { $inc: { 'relatedLinks.$.clickCount': 1 } },
      { upsert: true },
    );
  }

  @Public()
  @Put(':uuid/:fileName/click')
  async clickFile(
    @Param('uuid') uuid: string,
    @Param('fileName') fileName: string,
  ) {
    const mod = await this.modService.modModel.findById(uuid);

    if (!mod || mod.invalid) {
      throw new NotFoundException('未找到指定模组');
    }

    await this.modService.modModel.updateOne(
      {
        _id: mod._id,
        modFiles: { $elemMatch: { name: fileName } },
      },
      { $inc: { 'modFiles.$.clickCount': 1 } },
      { upsert: true },
    );
  }

  @Post(':uuid/apply-editor')
  async applyEditor(
    @Param('uuid') uuid: string,
    @UserDecorator() user: UserDocument,
  ) {
    const mod = await this.modService.modModel.findById(uuid);
    if (!mod || mod.invalid) {
      throw new NotFoundException('未找到指定模组');
    }

    if (user.createdAt.getTime() + 14 * 24 * 3600 * 1000 > Date.now()) {
      throw new ForbiddenException('注册时间大于14天才可以申请');
    }

    if (user.likedCount < 1) {
      throw new ForbiddenException('被赞数大于0才可以申请');
    }

    if (this.modService.EditorsHasUserId(mod, user._id)) {
      throw new ForbiddenException('您已经是此模组的编辑者');
    }

    await this.modService.addEditor(mod._id, user._id);
  }

  @Roles(Role.Superuser)
  @Post(':uuid/invalid')
  async invalid(
    @UserDecorator() user: UserDocument,
    @Param('uuid') uuid: string,
  ): Promise<any> {
    const mod = await this.modService.modModel.findById(uuid);
    if (!mod || mod.invalid) {
      throw new NotFoundException('未找到指定模组');
    }

    await this.modService.deleteMod(mod);
  }
}
