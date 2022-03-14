import { OperationLogService } from '@app/operationLog/services';
import { SearchService } from '@app/search/search.services';
import { UpdateTagDto } from '@app/tag/dto';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import _ from 'lodash';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { TagQuery } from './dto';
import { Tag as TagDocument } from './schemas';

@Injectable()
export class TagService {
  constructor(
    @InjectModel(TagDocument.name) public readonly tagModel: Model<TagDocument>,
    private operationLogService: OperationLogService,
    private configService: ConfigService,
    private searchService: SearchService,
  ) {}

  async searchTag(searchQuery: TagQuery) {
    const { keyword, page = 1, pageSize = 10 } = searchQuery;
    const index = `${this.configService.get<string>(
      'MONGODB_DATABASE',
    )}.${TagDocument.name.toLocaleLowerCase()}s`;
    const query = await (async () => {
      const result = {
        bool: {},
      };

      Object.assign(result.bool, {
        must_not: {
          term: {
            invalid: true,
          },
        },
      });

      if (keyword !== undefined) {
        Object.assign(result.bool, {
          must: [
            {
              multi_match: {
                query: keyword,
                fields: ['name'],
                type: 'phrase',
              },
            },
          ],
        });
      }

      return result;
    })();

    const result = await this.searchService.search({
      index,
      body: {
        size: pageSize + 1,
        from: Math.max(page - 1, 0) * pageSize,
        query,
        sort: [{ _score: { order: 'desc' } }],
        // highlight: {
        //   fields: {
        //       "title" : {}
        //   }
        // }
      },
    });
    return result;
  }

  async findOneTag(idOrName: string) {
    if (ObjectId.isValid(idOrName)) {
      return this.tagModel.findById(idOrName);
    }

    return this.tagModel.findOne({
      $or: [{ name: idOrName }, { alias: { $in: [idOrName] } }],
    });
  }

  async getOrCreateTag(tagName: string) {
    const hadTag = await this.findOneTag(tagName);

    if (hadTag) {
      return hadTag;
    }

    const tag = new this.tagModel({
      name: tagName,
    });
    await tag.save();

    return tag;
  }

  async getOrCreateTags(tagNames: Array<string>) {
    const hadTags = await this.tagModel.find({
      $or: [{ name: { $in: tagNames } }, { alias: { $in: tagNames } }],
    });

    const hadTagMap = hadTags.reduce(
      (a, b) => ({
        ...a,
        [b.name]: b.name,
        ...(() => b.alias.reduce((x, y) => ({ ...x, [y]: b.name }), {}))(),
      }),
      {},
    );

    const matchMap = tagNames.reduce(
      (a, b) => ({ ...a, [b]: hadTagMap[b] }),
      {},
    );
    const notInsertedTags = Object.keys(matchMap)
      .map(key => ({ key, value: matchMap[key] }))
      .filter(tag => tag.value === undefined);

    if (notInsertedTags.length === 0) {
      return hadTags;
    }

    const notInsertedTagNames = notInsertedTags.map(t => t.key);

    const nTags: Array<TagDocument> = await Promise.all(
      notInsertedTagNames.map(name =>
        (async () => {
          const tag = new this.tagModel({
            name,
          });

          tag.save();

          return tag;
        })(),
      ),
    );

    return hadTags.concat(nTags);
  }

  async checkEditPermission(user: UserDocument, tag: TagDocument) {
    if (user.checkRole('superuser')) {
      return true;
    }

    return false;
  }

  async updateTag(user: UserDocument, tag: TagDocument, dto: UpdateTagDto) {
    const changedKeys = Object.keys(dto)
      .map(key => ({ key, value: !_.isEqual(dto[key], tag[key]) }))
      .reduce((a, b) => (b.value ? [...a, b.key] : a), []) as string[];

    if (changedKeys.length === 0) {
      return tag;
    }

    const { children, ...innerDto } = dto;
    const updateDto = _.pick(innerDto, changedKeys);

    if (changedKeys.findIndex(key => key === 'children') !== -1) {
      const newTags = await this.getOrCreateTags(dto.children);
      const newTagNames = newTags.map(tag => tag.name);
      const currentTagNames = tag.children;
      Object.assign(updateDto, { children: newTagNames });

      const intersection = _.intersection(currentTagNames, newTagNames);
      const removed = _.xor(currentTagNames, intersection);
      const added = _.xor(newTagNames, intersection);

      const removedTags = await this.getOrCreateTags(removed);
      const addedTags = await this.getOrCreateTags(added);

      if (removed.length > 0) {
        await this.tagModel.updateMany(
          { _id: { $in: removedTags.map(tag => tag._id) } },
          { $pull: { parents: tag.name } },
        );
      }

      if (added.length > 0) {
        await this.tagModel.updateMany(
          { _id: { $in: addedTags.map(tag => tag._id) } },
          { $addToSet: { parents: tag.name } },
        );
      }
    }

    const log = new this.operationLogService.operationLogModel({
      targetName: TagDocument.name,
      targetId: tag._id.toHexString(),
      operator: user._id,
      changedKeys,
      before: _.pick(tag, changedKeys),
      after: updateDto,
    });

    await log.save();

    const updateData = (() => {
      const data = {
        $addToSet: { contributors: user._id },
      };

      Object.assign(data, updateDto);
      return data;
    })();

    await this.tagModel.updateOne({ _id: tag._id }, updateData, {
      upsert: true,
    });

    const nTag = await this.tagModel.findById(tag._id);

    return nTag;
  }
}
