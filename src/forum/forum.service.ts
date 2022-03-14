import { DomainService } from '@app/forum/domain.service';
import { CreateTopicDto, UpdateTopicDto } from '@app/forum/dto/topic.dto';
import { ModService } from '@app/mod/services';
import { IBasicSearchQuery } from '@app/search/search.interface';
import { SearchService } from '@app/search/search.services';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { computeDifference, getObjectId, objectIdEquals } from '@app/utils';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import {
  Domain as DomainDocument,
  DomainCategory as DomainCategoryDocument,
  Topic as TopicDocument,
} from './schemas';

@Injectable()
export class ForumService {
  constructor(
    @InjectModel(TopicDocument.name)
    public readonly topicModel: Model<TopicDocument>,
    @InjectModel(DomainDocument.name)
    public readonly domainModel: Model<DomainDocument>,
    @InjectModel(DomainCategoryDocument.name)
    public readonly domainCategoryModel: Model<DomainCategoryDocument>,
    private modService: ModService,
    private eventEmitter: EventEmitter2,
    private searchService: SearchService,
    private configService: ConfigService,
    private domainService: DomainService,
  ) {}

  async searchTopic(searchQuery: IBasicSearchQuery) {
    const { keyword, page = 1, pageSize = 10 } = searchQuery;
    const index = `${this.configService.get<string>(
      'MONGODB_DATABASE',
    )}.${TopicDocument.name.toLocaleLowerCase()}s`;
    const query = await (async () => {
      const result: any = {
        bool: {
          must_not: [{ term: { isDeleted: true } }],
          must: [
            {
              multi_match: {
                query: keyword,
                fields: ['title'],
                type: 'phrase',
              },
            },
          ],
        },
      };

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

  async getOrCreateDefaultCategory() {
    const category = await this.domainCategoryModel.findOne({
      isDefault: true,
    });
    if (category) {
      return category;
    }

    const nCategory = new this.domainCategoryModel({
      title: '综合板',
      isDefault: true,
    });

    await nCategory.save();

    return nCategory;
  }

  async updateModTopicCount() {
    const result = await this.topicModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $unwind: '$relatedMods',
      },
      {
        $group: {
          _id: '$relatedMods',
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

    const opts = result.map(r => ({
      updateOne: {
        filter: { _id: r._id },
        update: { topicCount: r.count },
      },
    }));

    return this.modService.modModel.bulkWrite(opts, { ordered: true, w: 1 });
  }

  async updateDomainPostCount(domain: DomainDocument) {
    const count = await this.topicModel.countDocuments({
      domain: domain._id,
      isDeleted: false,
    });
    domain.topicCount = count;
    await domain.save();

    return domain;
  }

  async createTopic(createTopicDto: CreateTopicDto, author: UserDocument) {
    const domainId = await (async () => {
      if (createTopicDto.domainId) {
        return createTopicDto.domainId;
      }

      return (
        await this.domainService.getOrCreateDefaultDomain()
      )._id.toHexString();
    })();

    const topic = new this.topicModel({
      domain: new ObjectId(domainId),
      author: author._id,
      title: createTopicDto.title,
      content: createTopicDto.content,
      isSpoiler: createTopicDto.isSpoiler || false,
      relatedMods: (createTopicDto.relatedModIds || []).map(
        id => new ObjectId(id),
      ),
    });

    await topic.save();

    await this.domainModel.updateOne(
      { _id: new ObjectId(domainId) },
      { $inc: { topicCount: 1 } },
      { upsert: true },
    );

    await this.modService.modModel.updateMany(
      { _id: { $in: topic.relatedMods.map(getObjectId) } },
      { $inc: { topicCount: 1 } },
      { upsert: true },
    );

    const nTopic = await this.topicModel
      .findById(topic._id)
      .populate('domain')
      .populate('author')
      .populate('relatedMods');

    return nTopic;
  }

  async updateTopic(
    updateTopicDto: Partial<UpdateTopicDto>,
    topic: TopicDocument,
  ) {
    const { title, content, isSpoiler, relatedModIds } = updateTopicDto;

    const updateData = (() => {
      const data: any = {};
      if (title) {
        Object.assign(data, { title });
      }
      if (content) {
        Object.assign(data, { content });
      }
      if (isSpoiler) {
        Object.assign(data, { isSpoiler });
      }
      if (relatedModIds) {
        Object.assign(data, {
          relatedMods: relatedModIds.map(id => new ObjectId(id)),
        });
      }

      return data;
    })();

    if (updateData.relatedModIds) {
      const { add, remove } = computeDifference(
        topic.relatedMods.map(getObjectId),
        updateData.relatedModIds,
        objectIdEquals,
      );

      await Promise.all([
        this.modService.modModel.updateMany(
          { _id: { $in: add } },
          { $inc: { topicCount: 1 } },
          { upsert: true },
        ),
        this.modService.modModel.updateMany(
          { _id: { $in: remove } },
          { $inc: { topicCount: -1 } },
          { upsert: true },
        ),
      ]);
    }

    await this.topicModel.updateOne({ _id: topic._id }, updateData, {
      upsert: true,
    });

    const nTopic = await this.topicModel
      .findById(topic._id)
      .populate('domain')
      .populate('author')
      .populate('relatedMods');

    return nTopic;
  }

  async deleteTopic(topic: TopicDocument) {
    topic.isDeleted = true;
    await this.domainModel.updateOne(
      { _id: topic.domain },
      { $inc: { topicCount: -1 } },
      { upsert: true },
    );

    await this.modService.modModel.updateMany(
      { _id: { $in: topic.relatedMods.map(getObjectId) } },
      { $inc: { topicCount: -1 } },
      { upsert: true },
    );

    await topic.save();
  }

  checkTopicPermission(topic: TopicDocument, user: UserDocument) {
    return user._id.equals(
      topic.author instanceof ObjectId ? topic.author : topic.author._id,
    );
  }
}
