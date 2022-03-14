import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getObjectId } from '@app/utils';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Collection as CollectionDocument } from './schemas';
import { AccessLevel } from './ineterface';
import { NotFoundException, ForbiddenException, ConflictException } from '@app/core';
import { UpdateCollectionDto, CreateCollectionDto, ItemDto } from './dto';
import _ from 'lodash';

@Injectable()
export class CollectionService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(CollectionDocument.name) public readonly collectionModel: Model<CollectionDocument>,
    private eventEmitter: EventEmitter2,
  ) {}


  async getOrCreateDefaultCollection(userId: string) {
    const collection = await this.collectionModel.findOne({ user: new ObjectId(userId), isDefault: true })
    if (collection) {
      return collection
    }

    const nCollection = new this.collectionModel({
      user: new ObjectId(userId),
      name: '默认收藏夹',
      isDefault: true,
      accessLevel: AccessLevel.Private,
    })
    await nCollection.save();

    return nCollection;
  }

  async getUserCollections(userId: string) {
    const collections = await this.collectionModel.find({ user: new ObjectId(userId), isDeleted: false })
    const favoriteCollections = await this.collectionModel.find({ favorites: { $in: [new ObjectId(userId)] } })
    
    if (collections.length > 0) {
      return collections.concat(favoriteCollections)
    }

    const defaultCollection = await this.getOrCreateDefaultCollection(userId)
    return [defaultCollection, ...favoriteCollections]
  }

  async checkCollectionReadPermission(collection: CollectionDocument, user?: UserDocument) {
    if (collection.accessLevel === AccessLevel.Public) {
      return;
    }

    if (collection.isDeleted) {
      throw new ForbiddenException('无法查看此收藏夹')
    }

    if (!user) {
      throw new ForbiddenException('无法查看此收藏夹')
    }
  
    if (collection.accessLevel === AccessLevel.Private && !getObjectId(collection.user).equals(user._id)) {
      throw new ForbiddenException('无法查看此收藏夹')
    }
  }

  async checkCollectionManagePermission(collection: CollectionDocument, user?: UserDocument) {
    if (!user) {
      throw new ForbiddenException('无法管理此收藏夹')
    }

    if (!getObjectId(collection.user).equals(user._id)) {
      throw new ForbiddenException('无法管理此收藏夹')
    }
  }

  async getCollection(id: string) {
    const collection = await this.collectionModel.findById(id);
    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    return collection;
  }

  // async getCollectionItems(collection: CollectionDocument) {
  // }

  async createCollection(dto: CreateCollectionDto, user: UserDocument) {
    const nCollection = new this.collectionModel({
      user: user._id,
      accessLevel: AccessLevel.Public,
      ...dto,
    })
    await nCollection.save();

    return nCollection;
  }

  async updateCollection(collection: CollectionDocument, dto: UpdateCollectionDto) {
    await this.collectionModel.updateOne(
      { _id: collection._id },
      { 
        ...dto,
      },
      { upsert: true },
    )
  }

  async deleteCollection(collection: CollectionDocument) {
    if (collection.isDefault) {
      throw new ForbiddenException('无法删除默认收藏夹')
    }

    await this.collectionModel.updateOne(
      { _id: collection._id },
      { 
        isDeleted: true,
      },
      { upsert: true },
    )
  }

  async updateCollectionsCount(collections: Array<CollectionDocument>) {
    const result = await this.collectionModel.aggregate<{ 
      _id: string
      count: number,
    }>([
      { 
        $match: { 
          isDeleted: false,
          _id: { $in: collections.map(c => c._id) },
        } 
      },
      {
        $project: {
          count: { $size: '$items' }
        }
      }
    ])


    const opts = result.map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: { itemCount: r.count },
      }
    }))

    await this.collectionModel.bulkWrite(opts, { ordered: true, w: 1 })

  }

  async updateItems(items: Array<ItemDto>, collection: CollectionDocument) {
    const uniItems = _.uniq(items).map((item, index) => ({
      ...item,
      order: index,
    }));
    collection.items = uniItems;
    collection.itemCount = uniItems.length;
    console.log(items)
    console.log(uniItems)
    await collection.save();
  }

  async addItemsForCollections(items: Array<ItemDto>, collections: Array<CollectionDocument>) {
    await this.collectionModel.updateMany(
      { _id: { $in: collections.map(c => c._id) } },
      {
        $addToSet: { items: { $each: items } },
      },
      { upsert: true },
    )

    await this.updateCollectionsCount(collections);
  }

  async removeItemsForCollections(items: Array<ItemDto>, collections: Array<CollectionDocument>) {
    await this.collectionModel.updateMany(
      { _id: { $in: collections.map(c => c._id) } },
      {
        $pull: { items: { $in: items } },
      },
      { upsert: true },
    )

    await this.updateCollectionsCount(collections);
  }

  async favoriteBy(collection: CollectionDocument, user: UserDocument) {
    if (getObjectId(collection).equals(user._id)) {
      throw new ConflictException('无法收藏自己创建的收藏夹')
    }

    await this.collectionModel.updateOne(
      { _id: collection._id },
      {
        $addToSet: { favorites: user._id },
      },
      { upsert: true },
    )

    const nCollection = await this.collectionModel.findById(collection._id);
    nCollection.favoriteCount = nCollection.favorites.length;
    await nCollection.save();

    return nCollection;
  }

  async cancelFavoriteBy(collection: CollectionDocument, user: UserDocument) {
    if (getObjectId(collection).equals(user._id)) {
      throw new ConflictException('无法取消收藏自己创建的收藏夹')
    }

    await this.collectionModel.updateOne(
      { _id: collection._id },
      {
        $pull: { favorites: user._id },
      },
      { upsert: true },
    )

    const nCollection = await this.collectionModel.findById(collection._id);
    nCollection.favoriteCount = nCollection.favorites.length;
    await nCollection.save();

    return nCollection;
  }

  getStatusMap(item: ItemDto, collections: Array<CollectionDocument>): Record<string, boolean> {
    return collections
      .reduce((a, b) => ({
        ...a,
        [b._id.toHexString()]: b.items.findIndex(i => i.targetId === item.targetId && i.targetName === item.targetName) !== -1,
      }), {})
  }
}
