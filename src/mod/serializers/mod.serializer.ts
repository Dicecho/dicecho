import { Mod as ModDocument } from '@app/mod/schemas/mod.schema';
import { IModDto, ModRateInfoKey } from '@app/mod/dto/mod.dto';
import { ObjectId } from 'mongodb';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseSerializer, isInstanceArray } from '@app/core';
import { Exclude, Expose } from 'class-transformer';
import { DEFAULT_COVER_URL } from '@app/shared/constants';

const RATE_INFO_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

interface ModSerializerCtx {
  userRatedIds: Array<string>;
  userEditedIds: Array<string>;
  user: UserDocument;
}

class ModSerializer extends BaseSerializer<ModDocument, ModSerializerCtx> implements IModDto {
  constructor(
    partial: Partial<ModDocument>,
    context: Partial<ModSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }
  alias: string = '';
  description: string = '';
  origin: string = '';
  moduleRule: string = '';
  isForeign: boolean = true;
  boothAliaseId: number = 0;
  cnmodsAliaseId: number = 0;
  releaseDate: Date = new Date();
  lastEditAt: Date = new Date();
  tags: Array<string> = [];
  languages: Array<string> = [];
  topicCount: number = 0;

  @Expose()
  get modFiles() {
    if (!this._obj.modFiles) {
      return []
    }

    return this._obj.modFiles.map((file) => ({
      ...file,
      clickCount: file.clickCount || 0
    }))
  }

  @Expose()
  get originUrl() {
    // if (!this._obj.isForeign) {
    //   return ''
    // }

    if (this._obj.originUrl) {
      return this._obj.originUrl
    }

    if (this._obj.boothAliaseId) {
      return `https://booth.pm/zh-cn/items/${this._obj.boothAliaseId}`
    }

    if (this._obj.cnmodsAliaseId) {
      return `https://www.cnmods.net/#/moduleDetail/index?keyId=${this._obj.cnmodsAliaseId}`
    }

    return '';
  }

  @Expose()
  get relatedLinks() {
    if (!this._obj.relatedLinks) {
      return []
    }

    return this._obj.relatedLinks.map((link) => ({
      ...link,
      clickCount: link.clickCount || 0
    }))
  }

  @Expose()
  get rateAvg() {
    if (this.validRateCount && this.validRateCount < 5) {
      return 0
    }

    return this._obj.rateAvg ? parseFloat(this._obj.rateAvg.toFixed(1)) : 0;
  }

  @Expose()
  get originTitle() {
    return this._obj.originTitle || this._obj.title;
  }

  @Expose()
  get title() {
    return this._obj.title || this._obj.originTitle;
  }

  @Expose()
  get playerNumber(): [number, number] {
    if (this._obj.playerNumber.length !== 2) {
      return [0, 0]
    }

    return this._obj.playerNumber || [0, 0]
  }

  @Expose()
  get imageUrls() {
    return this._obj.imageUrls ? this._obj.imageUrls.map((url) => encodeURI(url).replace(/\(/g, '\\(').replace(/\)/g, '\\)')) : []
  }

  @Expose()
  get coverUrl() {
    const url = this._obj.coverUrl ? encodeURI(this._obj.coverUrl).replace(/\(/g, '\\(').replace(/\)/g, '\\)') : DEFAULT_COVER_URL;
    const urlObj = new URL(url)
    if (urlObj.hostname === 'file.dicecho.com' && urlObj.search !== '') {
      return `${url}?x-oss-process=image/resize,w_512/quality,Q_80`
    }

    return url
  }

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  @Expose()
  get rateInfo(): { [key in ModRateInfoKey]: number } {
    const count = this.rateCount;
    const rateInfo = this._obj.rateInfo || {};
    if (count === 0) {
      return {
        [ModRateInfoKey.ONE]: 0,
        [ModRateInfoKey.TWO]: 0,
        [ModRateInfoKey.THREE]: 0,
        [ModRateInfoKey.FOUR]: 0,
        [ModRateInfoKey.FIVE]: 0,
      }
    }

    return RATE_INFO_KEYS.reduce((a, b) => ({ ...a, [Math.ceil(parseInt(b) / 2)]: (a[Math.ceil(parseInt(b) / 2)] || 0) + (rateInfo[b] || 0) }), {}) as { [key in ModRateInfoKey]: number }
  }

  @Expose()
  get author(): { isForeign: true; nickName: string; avatarUrl: string; } | { isForeign: false; _id: string; nickName: string; avatarUrl: string; } {
    if (this._obj.isForeign && this._obj.foreignAuthor) {
      return {
        isForeign: true,
        nickName: this._obj.foreignAuthor.nickName,
        avatarUrl: this._obj.foreignAuthor.avatarUrl || `/avatars/${this._obj.foreignAuthor.nickName}`,
      }
    }
    
    if (this._obj.author) {
      if (this._obj.author instanceof ObjectId ) {
        throw new Error('mod的user字段对象错误')
      }

      return {
        isForeign: false,
        _id: this._obj.author._id.toString(),
        nickName: this._obj.author.nickName,
        avatarUrl: this._obj.author.avatarUrl || `/avatars/${this._obj.author.nickName}`,
      }
    }

    return {
      isForeign: true,
      nickName: this._obj.foreignAuthor.nickName,
      avatarUrl: this._obj.foreignAuthor.avatarUrl || `/avatars/${this._obj.foreignAuthor.nickName}`,
    }
  }

  @Expose()
  get contributors() {

    if (this._obj.contributors.length === 0) {
      return []
    }

    if (isInstanceArray(this._obj.contributors, ObjectId)) {
      throw new Error('mod的contributors字段对象错误')
    }

    return this._obj.contributors.map(contributor => ({
      _id: contributor._id.toString(),
      nickName: contributor.nickName,
      avatarUrl: contributor.avatarUrl || `/avatars/${contributor.nickName}`,
    }))
  }

  @Expose()
  get canEdit() {
    if (!this._context.user) {
      return false;
    }

    if (this._context.user.checkRole('superuser')) {
      return true;
    }

    if (this._obj.author) {
      if (this._obj.author instanceof ObjectId ) {
        throw new Error('mod的author字段对象错误')
      }

      return this._context.user._id.equals(this._obj.author._id)
    }

    if(!this._context.userEditedIds) {
      return false
    }

    return this._context.userEditedIds.findIndex(id => this._obj._id.equals(id)) !== -1;
  }

  @Expose()
  get rateCount() {
    return this._obj.rateCount || 0
  }

  @Expose()
  get canDownload() {
    return !this._obj.isForeign && this._obj.modFiles.length > 0;
  }

  @Expose()
  get validRateCount() {
    return this._obj.validRateCount || this.rateCount;
  }

  @Expose()
  get markCount() {
    return this._obj.markCount || 0
  }

  @Expose()
  get isRated() {
    if(!this._context.userRatedIds) {
      return false
    }
    return this._context.userRatedIds.findIndex(id => id === this._obj._id.toString()) !== -1;
  }
}

export { ModSerializer };