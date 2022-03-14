import { BlockService } from '@app/block/block.service';
import { BlockTargetName } from '@app/block/interface';
import { ConflictException } from '@app/core';
import { FileService } from '@app/file/file.service';
import { ContributeModDto, CreateModDto, UpdateModDto } from '@app/mod/dto';
import { ModListQuery, SortOrder } from '@app/mod/dto/mod.dto';
import { Mod as ModDocument } from '@app/mod/schemas';
import { OperationLogService } from '@app/operationLog/services';
import { RateType } from '@app/rate/constants';
import { Rate as RateDocument } from '@app/rate/schemas';
import { MONGO_ES_OPERATION_MAP } from '@app/search/search.contants';
import { SearchService } from '@app/search/search.services';
import { TagService } from '@app/tag/tag.service';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { getObjectId } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import _ from 'lodash';
import moment from 'moment';
import { ObjectId } from 'mongodb';
import { FilterQuery, Model } from 'mongoose';

@Injectable()
export class ModService {
  constructor(
    @InjectModel(RateDocument.name) public rateModel: Model<RateDocument>,
    @InjectModel(ModDocument.name) public modModel: Model<ModDocument>,
    private fileService: FileService,
    private blockService: BlockService,
    private configService: ConfigService,
    private searchService: SearchService,
    private tagService: TagService,
    private operationLogService: OperationLogService,
  ) {}
  private readonly logger = new Logger(ModService.name);

  async find(query?: FilterQuery<ModDocument>) {
    return await this.modModel.find(query);
  }

  getMod(uuidOrTitle: string) {
    const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
    if (ObjectId.isValid(uuidOrTitle) && checkForHexRegExp.test(uuidOrTitle)) {
      return this.modModel.findById(uuidOrTitle);
    }

    return this.modModel.findOne({ title: uuidOrTitle });
  }

  async checkModReadPermission(mod: ModDocument) {
    return !mod.invalid;
  }

  async searchMod(
    modSearchQuery: ModListQuery,
    user?: UserDocument,
    clientCountry?: string,
  ) {
    const { filter = {}, sort, origins, tags, keyword } = modSearchQuery;
    const { updatedAt, ...innerFilter } = filter;
    const index = `${this.configService.get<string>(
      'MONGODB_DATABASE',
    )}.${ModDocument.name.toLocaleLowerCase()}s`;
    const query = await (async () => {
      const result: any = {
        bool: {
          must_not: [{ term: { invalid: true } }],
        },
      };

      if (user !== undefined) {
        const blockIds = await this.blockService.getUserBlockIds(
          BlockTargetName.Mod,
          user._id.toHexString(),
        );
        if (blockIds.length > 0) {
          const must_not: Array<any> = (result.bool.must_not || []).concat({
            terms: { _id: blockIds },
          });
          // Object.assign(result.bool.must_not,
          Object.assign(result.bool, { must_not });
        }
      }

      if (innerFilter !== undefined) {
        Object.assign(result.bool, {
          filter: [
            ...Object.keys(innerFilter).map(key => ({
              term: {
                [_.isString(innerFilter[key])
                  ? `${key}.keyword`
                  : key]: innerFilter[key],
              },
            })),
          ],
        });
      }

      if (origins !== undefined) {
        const filter: Array<any> = (result.bool.filter || []).concat({
          terms: { 'origin.keyword': origins },
        });
        Object.assign(result.bool, { filter });
      }

      if (keyword !== undefined) {
        const must: Array<any> = (result.bool.must || []).concat({
          multi_match: {
            query: modSearchQuery.keyword,
            fields: [
              'title',
              'description',
              'foreignAuthor.nickName',
              'alias',
              'originTitle',
              'tags',
            ],
            type: 'phrase',
          },
        });
        Object.assign(result.bool, { must });
      }

      if (tags !== undefined) {
        const must: Array<any> = (result.bool.must || []).concat(
          tags.map(tag => ({ term: { 'tags.keyword': tag } })),
        );
        Object.assign(result.bool, { must });
      }

      if (updatedAt !== undefined) {
        const must: Array<any> = (result.bool.must || []).concat({
          range: {
            updatedAt: Object.keys(updatedAt).reduce(
              (a, b) => ({ ...a, [MONGO_ES_OPERATION_MAP[b]]: updatedAt[b] }),
              {},
            ),
          },
        });
        Object.assign(result.bool, { must });
      }

      return result;
    })();
    const elasticSort = sort
      ? Object.keys(sort).map(key => ({
          [key]: {
            order: parseInt(sort[key]) === SortOrder.ASC ? 'asc' : 'desc',
          },
        }))
      : [];
    const result = await this.searchService.search({
      index,
      body: {
        size: modSearchQuery.pageSize + 1,
        from: Math.max(modSearchQuery.page - 1, 0) * modSearchQuery.pageSize,
        query,
        sort: [{ _score: { order: 'desc' } }, ...elasticSort],
        // highlight: {
        //   fields: {
        //       "title" : {}
        //   }
        // }
      },
    });
    return result;
  }

  async getEditModIds(userId: string): Promise<Array<string>> {
    const mods = await this.modModel.find({
      editors: { $in: [new ObjectId(userId)] },
    });

    return mods.map(mod => getObjectId(mod).toHexString());
  }

  async getModRule() {
    const result = await this.modModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          invalid: false,
        },
      },
      {
        $group: {
          _id: '$moduleRule',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return result;
  }

  async getModLanguage() {
    const result = await this.modModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          invalid: false,
          languages: { $exists: true, $ne: [] },
        },
      },
      {
        $unwind: '$languages',
      },
      {
        $group: {
          _id: '$languages',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return result;
  }

  async getModOrigin() {
    const result = await this.modModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          invalid: false,
        },
      },
      {
        $group: {
          _id: '$origin',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return result;
  }

  async getTagModCount() {
    const result = await this.modModel.aggregate<{
      _id: string;
      modCount: number;
    }>([
      {
        $match: {
          invalid: false,
          tags: { $ne: [], $exists: true },
        },
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', modCount: { $sum: 1 } } },
    ]);

    return result;
  }

  async checkEditPermission(user: UserDocument, mod: ModDocument) {
    if (user.checkRole('superuser')) {
      return true;
    }

    if (!mod.isForeign) {
      return user._id.equals(
        mod.author instanceof ObjectId ? mod.author : mod.author._id,
      );
    }

    if (this.EditorsHasUserId(mod, user._id.toHexString())) {
      return true;
    }

    return false;
  }

  async getHotModIds(recentDays: number = 7) {
    const result = await this.rateModel.aggregate<{
      _id: ObjectId;
      count: number;
    }>([
      {
        $match: {
          isDeleted: false,
          rateAt: {
            $gte: moment()
              .subtract(recentDays, 'days')
              .toDate(),
          },
        },
      },
      {
        $group: {
          _id: '$mod',
          count: {
            $sum: { $cond: [{ $eq: ['$type', RateType.Rate] }, 1, 0.2] },
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return result.map(r => r._id);
  }

  async getRecommendModIds(targetMod: ModDocument) {
    const result = await this.modModel.aggregate<{
      _id: ObjectId;
      // count: number,
    }>([
      {
        $match: {
          moduleRule: targetMod.moduleRule,
          tags: {
            $in: targetMod.tags,
          },
          _id: {
            $ne: targetMod._id,
          },
        },
      },
      {
        $set: {
          size: {
            $size: { $setIntersection: [targetMod.tags, '$tags'] },
          },
        },
      },
      {
        $sort: {
          size: -1,
        },
      },
    ]);

    return result.map(r => r._id);
  }

  async createMod(user: UserDocument, createModDto: CreateModDto) {
    const {
      author,
      originUrl,
      modFiles,
      releaseDate = new Date(),
      ...modAttr
    } = createModDto;

    const nMod = (() => {
      if (createModDto.isForeign) {
        const nMod = new this.modModel({
          foreignAuthor: {
            nickName: author,
          },
          releaseDate: new Date(releaseDate),
          ...modAttr,
        });

        if (originUrl) {
          const origin = new URL(originUrl).hostname;
          nMod.origin = origin;
          nMod.originUrl = originUrl;
        }

        return nMod;
      }

      return new this.modModel({
        author: user._id,
        modFiles,
        ...createModDto,
      });
    })();

    await nMod.save();

    await this.modModel.updateOne(
      { _id: nMod._id },
      { $addToSet: { contributors: { $each: [user._id] } } },
      { upsert: true },
    );

    if (createModDto.tags) {
      const tags = await this.tagService.getOrCreateTags(createModDto.tags);

      await this.tagService.tagModel.updateMany(
        { _id: { $in: tags.map(tag => tag._id) } },
        { $inc: { modCount: 1 } },
      );
    }

    const log = new this.operationLogService.operationLogModel({
      targetName: 'Mod',
      targetId: nMod._id.toHexString(),
      operator: user._id,
      action: 'create',
      changedKeys: Object.keys(createModDto),
      before: {},
      after: createModDto,
    });

    await log.save();

    return nMod;
  }

  async updateMod(
    user: UserDocument,
    mod: ModDocument,
    updateModDto: UpdateModDto | ContributeModDto,
  ) {
    const changedKeys = Object.keys(updateModDto)
      .map(key => ({ key, value: !_.isEqual(updateModDto[key], mod[key]) }))
      .reduce((a, b) => (b.value ? [...a, b.key] : a), []) as string[];

    if (changedKeys.length === 0) {
      return mod;
    }

    if (changedKeys.findIndex(key => key === 'title') !== -1) {
      const checkMod = await this.modModel.findOne({
        title: updateModDto.title,
        invalid: false,
      });
      if (checkMod) {
        throw new ConflictException('已有重名模组，请您考虑换个名字');
      }
    }

    const updateData = (() => {
      const data = {
        $addToSet: { contributors: { $each: [user._id] } },
      };

      if (mod.isForeign) {
        const {
          author,
          originUrl,
          releaseDate,
          tags,
          ...dto
        } = updateModDto as ContributeModDto;

        if (author) {
          Object.assign(data, {
            foreignAuthor: {
              avatarUrl: mod.foreignAuthor?.avatarUrl || '',
              nickName: author,
            },
          });
        }

        if (originUrl !== undefined) {
          const origin = originUrl ? new URL(originUrl).hostname : '';
          Object.assign(data, {
            origin,
            originUrl,
          });
        }

        if (releaseDate) {
          Object.assign(data, {
            releaseDate: new Date(releaseDate),
          });
        }

        Object.assign(data, dto);

        return data;
      }

      const { tags, ...dto } = updateModDto as UpdateModDto;

      Object.assign(data, dto);
      return data;
    })();

    if (changedKeys.findIndex(key => key === 'tags') !== -1) {
      const newTags = await this.tagService.getOrCreateTags(updateModDto.tags);
      const newTagNames = newTags.map(tag => tag.name);
      const currentTagNames = mod.tags;
      Object.assign(updateData, { tags: newTagNames });

      const intersection = _.intersection(currentTagNames, newTagNames);
      const removed = _.xor(currentTagNames, intersection);
      const added = _.xor(newTagNames, intersection);

      if (removed.length > 0) {
        const removedTags = await this.tagService.getOrCreateTags(removed);
        await this.tagService.tagModel.updateMany(
          { _id: { $in: removedTags.map(tag => tag._id) } },
          { $inc: { modCount: -1 } },
        );
      }

      if (added.length > 0) {
        const addedTags = await this.tagService.getOrCreateTags(added);
        await this.tagService.tagModel.updateMany(
          { _id: { $in: addedTags.map(tag => tag._id) } },
          { $inc: { modCount: 1 } },
        );
      }
    }

    const before = _(mod)
      .pick(changedKeys)
      .omit('author')
      .value();
    const after = _(updateData)
      .pick(changedKeys)
      .omit('author')
      .value();

    if (_.includes(changedKeys, 'author')) {
      if (mod.isForeign) {
        const { ...dto } = updateModDto as ContributeModDto;
        Object.assign(before, { author: mod?.foreignAuthor?.nickName || '' });
        Object.assign(after, { author: dto.author });
      }
    }

    const log = new this.operationLogService.operationLogModel({
      targetName: 'Mod',
      targetId: mod._id.toHexString(),
      operator: user._id,
      changedKeys,
      before,
      after,
    });

    await log.save();

    console.log(updateData);

    await this.modModel.updateOne(
      { _id: mod._id },
      { lastEditAt: new Date(), ...updateData },
      { upsert: true },
    );

    const nMod = await this.modModel
      .findById(mod._id)
      .populate('author')
      .populate('contributors');

    return nMod;
  }

  async deleteMod(mod: ModDocument) {
    mod.invalid = true;
    await mod.save();

    const tags = await this.tagService.getOrCreateTags(mod.tags);
    await this.tagService.tagModel.updateMany(
      { _id: { $in: tags.map(tag => tag._id) } },
      { $inc: { modCount: -1 } },
    );
  }

  async withdrawMod(mod: ModDocument, author: UserDocument) {
    await this.modModel.updateOne(
      { _id: mod._id },
      {
        $unset: { author: '' },
        $set: {
          foreignAuthor: {
            nickName: author.nickName,
          },
        },
        isForeign: true,
      },
      { upsert: true },
    );
  }

  addEditor(modId: ObjectId, editorId: ObjectId) {
    return this.modModel.updateOne(
      { _id: modId },
      { $push: { editors: editorId } },
      { upsert: true },
    );
  }

  EditorsHasUserId(mod: ModDocument, userId: any): boolean {
    return mod.editors.findIndex((editor: ObjectId | UserDocument) => {
      if (!(editor instanceof ObjectId)) {
        return false
      }
    
      return editor.equals(userId)
    }) !== -1
  };
}
