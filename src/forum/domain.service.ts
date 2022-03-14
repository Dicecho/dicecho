import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Mod as ModDocument } from '@app/mod/schemas';
import { 
  Topic as TopicDocument,
  Domain as DomainDocument,
  DomainCategory as DomainCategoryDocument,
  DomainMember as DomainMemberDocument,
} from './schemas';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { ModService } from '@app/mod/services';
import { NotFoundException, ConflictException, ForbiddenException } from '@app/core';
import crypto from "crypto";

@Injectable()
export class DomainService {
  constructor(
    // @InjectModel(TopicDocument.name) public readonly topicModel: Model<TopicDocument>,
    @InjectModel(DomainCategoryDocument.name) public readonly domainCategoryModel: Model<DomainCategoryDocument>,
    @InjectModel(DomainMemberDocument.name) public readonly domainMemberModel: Model<DomainMemberDocument>,
    @InjectModel(DomainDocument.name) public readonly domainModel: Model<DomainDocument>,
    // @InjectModel(DomainCategoryDocument.name) public readonly domainCategoryModel: Model<DomainCategoryDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getDomain(uuidOrTitle: string) {
    const checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$")
    if (ObjectId.isValid(uuidOrTitle) && checkForHexRegExp.test(uuidOrTitle)) {
      return this.domainModel.findById(uuidOrTitle)
    }

    return this.domainModel.findOne({ title: uuidOrTitle })
  }

  async deleteDomainMember(userId: string, domainId: string) {
    const member = await this.domainMemberModel.findOne({
      user: new ObjectId(userId),
      domain: new ObjectId(domainId),
    })

    if (!member) {
      return;
    }

    member.isDeleted = true;
    member.save()
    await this.domainModel.updateOne(
      { _id: new ObjectId(domainId) },
      { $inc: { memberCount: -1 } },
      { upsert: true },
    );
  }

  async getOrCreateDomainMember(userId: string, domainId: string) {
    const member = await this.domainMemberModel.findOne({
      user: new ObjectId(userId),
      domain: new ObjectId(domainId),
    })

    if (member && !member.isDeleted) {
      return member;
    }

    if (member) {
      member.isDeleted = false;
      await member.save();
      await this.domainModel.updateOne(
        { _id: new ObjectId(domainId) },
        { $inc: { memberCount: 1 } },
        { upsert: true },
      );
  
      return member;
    }

    const nMember = new this.domainMemberModel({ 
      user: new ObjectId(userId),
      domain: new ObjectId(domainId),
    })

    await nMember.save()

    await this.domainModel.updateOne(
      { _id: new ObjectId(domainId) },
      { $inc: { memberCount: 1 } },
      { upsert: true },
    );

    return nMember;
  }

  async joinDomain(user: UserDocument, domain: DomainDocument) {
    if (!domain.rule || !domain.rule.join) {
      return this.getOrCreateDomainMember(user._id.toHexString(), domain._id.toHexString())
    }
    if (domain.rule.join === 'open') {
      return this.getOrCreateDomainMember(user._id.toHexString(), domain._id.toHexString())
    }
    throw new ForbiddenException('暂不支持加入此版');
  }

  async getJoinedDomain(user?: UserDocument) {
    if (!user) {
      return [];
    }

    return this.domainMemberModel.find({ user: user._id, isDeleted: false })
  }

  async getOrCreateDefaultDomain() {
    const domain = await this.domainModel.findOne({ isDefault: true })
    if (domain) {
      return domain;
    }

    const nDomain = new this.domainModel({
      title: 'default',
      isDefault: true,
    })

    await nDomain.save()

    return nDomain
  }

  async getOrCreateDefaultCategory() {
    const category = await this.domainCategoryModel.findOne({ isDefault: true })
    if (category) {
      return category;
    }

    const nCategory = new this.domainCategoryModel({
      title: '综合板',
      isDefault: true,
    })

    await nCategory.save()

    return nCategory
  }

  // async getOrCreateModDomain(mod: ModDocument) {
  //   if (mod.domain) {
  //     if (mod.domain instanceof ObjectId) {
  //       return this.domainModel.findById(mod.domain)
  //     }

  //     return mod.domain;
  //   }

  //   const category = await this.getOrCreateDefaultCategory()

  //   const domain = new this.domainModel({
  //     title: mod.title,
  //     category,
  //   })

  //   await domain.save()
  //   mod.domain = domain._id
  //   await mod.save()

  //   return domain
  // }

  async getOrCreateDomain(title: string) {
    const domain = await this.domainModel.findOne({ title })
    if (domain) {
      return domain
    }

    const nDomain = new this.domainModel({ title: title })
    nDomain.save()
    return nDomain
  }

  async addParent(domain: DomainDocument, parent: DomainDocument) {
    const addChildren = async (domain: DomainDocument, child: DomainDocument) => {
      await this.domainModel.updateOne(
        { _id: domain._id },
        { $push: { children: child._id } },
        { upsert: true },
      )

      if (domain.parent) {
        const parent = await this.domainModel.findById(domain.parent);
        addChildren(parent, child)
      }
    }

    if (domain.parent) {
      throw new ConflictException('此板块已设置父板块')
    }

    domain.parent = parent;
    domain.save();
    await addChildren(parent, domain);
  }
}
