import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@app/core';
import { IBasicSearchQuery } from '@app/search/search.interface';
import { SearchService } from '@app/search/search.services';
import { EmailVertifyDto } from '@app/users/dto';
import { FOLLOW_EVENT_KEYS } from '@app/users/events';
import {
  Follow as FollowDocument,
  User as UserDocument,
} from '@app/users/schemas';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserDocument.name)
    public readonly userModel: Model<UserDocument>,
    @InjectModel(FollowDocument.name)
    public readonly followModel: Model<FollowDocument>,
    private eventEmitter: EventEmitter2,
    private searchService: SearchService,
    private configService: ConfigService,
  ) {}

  async search(searchQuery: IBasicSearchQuery) {
    const { keyword, page = 1, pageSize = 10 } = searchQuery;
    const index = `${this.configService.get<string>(
      'MONGODB_DATABASE',
    )}.${UserDocument.name.toLocaleLowerCase()}s`;
    const query = await (async () => {
      const result: any = {
        bool: {
          must: [
            { term: { verified: true } },
            {
              multi_match: {
                query: keyword,
                fields: ['nickName', 'note'],
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

  async createUser(email: string): Promise<UserDocument> {
    const checkUser = await this.userModel.findOne({ email: email });
    if (checkUser) {
      throw new ConflictException('此email已被注册');
    }

    const user = new this.userModel({
      email: email,
      verification: crypto.randomBytes(20).toString('hex'),
      verified: false,
    });
    await user.save();
    return user;
  }

  async emailVertify(emailVertifyDto: EmailVertifyDto): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email: emailVertifyDto.email });
    if (!user) {
      throw new ConflictException('此用户不存在');
    }

    if (user.verified) {
      throw new ConflictException('用户已验证过邮箱');
    }

    const checkNickname = await this.userModel.findOne({
      nickName: emailVertifyDto.nickName,
    });
    if (checkNickname) {
      throw new ConflictException('此昵称已被占用');
    }

    if (user.verification !== emailVertifyDto.vertifyCode) {
      throw new BadRequestException('账号验证码错误，请重新获取邮件');
    }

    user.nickName = emailVertifyDto.nickName;
    user.password = emailVertifyDto.password;
    user.verified = true;
    await user.save();

    return user;
  }

  async findUserByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async getFllowingIds(uuid: string): Promise<string[]> {
    const result = await this.followModel.find({
      follower: new ObjectId(uuid),
    });

    return result.map(data =>
      data.following instanceof ObjectId
        ? data.following.toHexString()
        : data.following._id.toHexString(),
    );
  }

  async getProfileCtx(
    uuid: string,
  ): Promise<{
    userFollowedSet: Record<string, boolean>;
  }> {
    return {
      userFollowedSet: (await this.getFllowingIds(uuid)).reduce(
        (a, b) => ({ ...a, [b]: true }),
        {},
      ),
    };
  }

  async followUser(followerId: string, targetId: string) {
    const target = await this.userModel.findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到指定用户');
    }

    if (target._id.equals(followerId)) {
      throw new ConflictException('无法关注自己');
    }

    const relation = await this.followModel.findOne({
      follower: new ObjectId(followerId),
      following: target._id,
    });

    if (relation) {
      throw new ConflictException('已经关注过此用户');
    }

    const nRelation = new this.followModel({
      follower: new ObjectId(followerId),
      following: target._id,
    });

    await nRelation.save();

    await this.userModel.updateOne(
      { _id: target._id },
      { $inc: { followerCount: 1 } },
      { upsert: true },
    );

    await this.userModel.updateOne(
      { _id: new ObjectId(followerId) },
      { $inc: { followingCount: 1 } },
      { upsert: true },
    );

    this.eventEmitter.emit(FOLLOW_EVENT_KEYS.FOLLOW, {
      follower: await this.userModel.findById(followerId),
      following: target,
    });
  }

  async unfollowUser(followerId: string, targetId: string) {
    const target = await this.userModel.findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到指定用户');
    }

    const relation = await this.followModel.findOne({
      follower: new ObjectId(followerId),
      following: target._id,
    });

    if (!relation) {
      throw new NotFoundException('未关注过此用户');
    }

    await this.followModel.deleteOne({ _id: relation._id });

    await this.userModel.updateOne(
      { _id: target._id },
      { $inc: { followerCount: -1 } },
      { upsert: true },
    );

    await this.userModel.updateOne(
      { _id: new ObjectId(followerId) },
      { $inc: { followingCount: -1 } },
      { upsert: true },
    );

    this.eventEmitter.emit(FOLLOW_EVENT_KEYS.UNFOLLOW, {
      follower: await this.userModel.findById(followerId),
      following: target,
    });
  }
}
