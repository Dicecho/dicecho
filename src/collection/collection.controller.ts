import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { UserDecorator, serialize, makePaginationResponse, serializeResponse, PageableQuery } from '@app/core';
import { PaginatedResponse } from '@app/interfaces/shared/api';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { CollectionSerializer } from './serializers';
import { ModSerializer } from '@app/mod/serializers';
import { Mod as ModDocument } from '@app/mod/schemas/mod.schema';
import { ICollectionDto, AccessLevel } from './ineterface';
import { Public } from '@app/auth/decorators/public.decorator';
import { CollectionService } from './collection.service';
import { CollectionListQuery, CreateCollectionDto, UpdateCollectionDto, ItemDto, UpdateItemsDto } from './dto'; 

@Controller('collection')
export class CollectionController {
  constructor(
    private collectionService: CollectionService,
  ) {}

  @Get('mine')
  async mine(
    @UserDecorator() user: UserDocument,
  ): Promise<Array<ICollectionDto>> {
    const collections = await this.collectionService.getUserCollections(user._id.toHexString())

    const ctx = {
      user,
    }
  
    return serialize(CollectionSerializer, collections, ctx) as Array<ICollectionDto>
  }

  @Get('status')
  async status(
    @Query() itemDto: ItemDto,
    @UserDecorator() user: UserDocument,
  ) {
    const collections = await this.collectionService.getUserCollections(user._id.toHexString())
    const statusMap = this.collectionService.getStatusMap(itemDto, collections)

    return statusMap
  }

  @Get()
  @Public()
  async list(
    @Query() query: CollectionListQuery,
    @UserDecorator() user?: UserDocument,
  ): Promise<PaginatedResponse<ICollectionDto>> {
    const { targetName, targetId, creatorId, filter } = query;

    const filterQuery = await (async () => {
      const result = {
        $and: []
      }
    
      result.$and.push({ isDeleted: { $ne: true } })
      result.$and.push({ accessLevel: AccessLevel.Public })

      if (filter && filter.isRecommend !== undefined) {
        result.$and.push({ isRecommend: filter.isRecommend })
      }

      // const accessLevelQuery: any = {
      //   $or: [{ accessLevel: AccessLevel.Public }],
      // }

      // if (user) {
      //   accessLevelQuery.$or.push({ user: user._id })
      // }

      // result.$and.push(accessLevelQuery)

      if (creatorId) {
        result.$and.push({ user: new ObjectId(creatorId) })
      }

      if (targetName && targetId) {
        result.$and.push({ items: { $elemMatch: { targetName, targetId }} })
      }

      return result;
    })();

    const result = await makePaginationResponse(
      this.collectionService.collectionModel,
      filterQuery,
      query,
    )
  
    const ctx = {
      user,
    }

    return await serializeResponse(result, CollectionSerializer, ctx);
  }

  @Get(':id')
  @Public()
  async retrieve(
    @Param('id') id: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<ICollectionDto> {
    const collection = await this.collectionService.getCollection(id)
    await this.collectionService.checkCollectionReadPermission(collection, user);
  
    const ctx = {
      user,
    }

    return serialize(CollectionSerializer, collection, ctx) as ICollectionDto
  }

  @Put(':id/favorite')
  async favorite(
    @Param('id') id: string,
    @UserDecorator() user: UserDocument,
  ): Promise<ICollectionDto> {
    const collection = await this.collectionService.getCollection(id);
    await this.collectionService.checkCollectionReadPermission(collection, user);
    const nCollection = await this.collectionService.favoriteBy(collection, user);

    const ctx = {
      user,
    }

    return serialize(CollectionSerializer, nCollection, ctx) as ICollectionDto
  }

  @Put(':id/cancelFavorite')
  async cancelFavorite(
    @Param('id') id: string,
    @UserDecorator() user: UserDocument,
  ): Promise<ICollectionDto> {
    const collection = await this.collectionService.getCollection(id);
    await this.collectionService.checkCollectionReadPermission(collection, user);
    const nCollection = await this.collectionService.cancelFavoriteBy(collection, user);

    const ctx = {
      user,
    }

    return serialize(CollectionSerializer, nCollection, ctx) as ICollectionDto
  }

  @Post()
  async create(
    @Body() createTopicDto: CreateCollectionDto,
    @UserDecorator() user: UserDocument,
  ): Promise<ICollectionDto> {

    const collection = await this.collectionService.createCollection(createTopicDto, user)
    const nCollection = await this.collectionService.collectionModel.findById(collection._id)
      .populate('user')

    const ctx = {
      user,
    }


    return serialize(CollectionSerializer, nCollection, ctx) as ICollectionDto
  }

  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() updateTopicDto: UpdateCollectionDto,
    @UserDecorator() user: UserDocument,
  ): Promise<ICollectionDto> {
    const collection = await this.collectionService.getCollection(uuid)
    await this.collectionService.checkCollectionManagePermission(collection, user);
    await this.collectionService.updateCollection(collection, updateTopicDto);

    const nCollection = await this.collectionService.collectionModel.findById(collection._id)
      .populate('user')

    const ctx = {
      user,
    }

    return serialize(CollectionSerializer, nCollection, ctx) as ICollectionDto
  }

  @Delete(':uuid')
  async delete(
    @Param('uuid') uuid: string,
    @UserDecorator() user: UserDocument,
  ) {
    const collection = await this.collectionService.getCollection(uuid)
    await this.collectionService.checkCollectionManagePermission(collection, user);
    await this.collectionService.deleteCollection(collection);
  }

  @Put(':uuid/add')
  async add(
    @Param('uuid') uuid: string,
    @Body() itemDto: ItemDto,
    @UserDecorator() user: UserDocument,
  ) {
    const collection = await this.collectionService.getCollection(uuid);
    await this.collectionService.checkCollectionManagePermission(collection, user);
    await this.collectionService.addItemsForCollections([itemDto], [collection])
  }

  @Put(':uuid/remove')
  async remove(
    @Param('uuid') uuid: string,
    @Body() itemDto: ItemDto,
    @UserDecorator() user: UserDocument,
  ) {
    const collection = await this.collectionService.getCollection(uuid);
    await this.collectionService.checkCollectionManagePermission(collection, user);
    await this.collectionService.removeItemsForCollections([itemDto], [collection])
  }

  @Get(':uuid/items')
  @Public()
  async getItems(
    @Param('uuid') uuid: string,
    @UserDecorator() user: UserDocument,
  ) {
    const result = (await this.collectionService.collectionModel
      .findById(uuid)
      .populate({
        path: 'items.targetId',
        model: 'Mod',
      })
    ).items.sort((a, b) => a.order - b.order).map(item => item.targetId as any as ModDocument)

    const ctx = {
      user
    }

    return serialize(ModSerializer, result, ctx) as any;
  }

  @Put(':uuid/items')
  async updateItems(
    @Param('uuid') uuid: string,
    @Body() updateItemsDto: UpdateItemsDto,
    @UserDecorator() user: UserDocument,
  ) {
    const collection = await this.collectionService.getCollection(uuid);
    await this.collectionService.checkCollectionManagePermission(collection, user);
    await this.collectionService.updateItems(updateItemsDto.items, collection);
  
    const nCollection = await this.collectionService.collectionModel.findById(collection._id)
      .populate('user')

    const ctx = {
      user,
    }

    return serialize(CollectionSerializer, nCollection, ctx) as ICollectionDto
  }
}
