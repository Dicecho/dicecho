import { BadRequestException, NotFoundException } from '@app/core';
import { FileService } from '@app/file/file.service';
import { Mod as ModDocument } from '@app/mod/schemas';
import { HttpService, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Replay as ReplayDocument } from './schemas';

const BILIBILI_API_ENDPOINT =
  'https://api.bilibili.com/x/web-interface/view?bvid=';

interface BilibiliApiRes<Data> {
  code: number;
  message: string;
  ttl: number;
  data: Data;
}

interface BilibiliViewData {
  bvid: string;
  aid: number;
  videos: number; // 有多少个视频，多个为合集
  tid: number;
  tname: string;
  copyright: number; // 1为
  pic: string; // 封面
  title: string;
  pubdate: 1545102002;
  ctime: 1545102003;
  desc: string;
  desc_v2: Array<{
    raw_text: string;
    type: number;
    biz_id: number;
  }>;
  state: number;
  duration: number;
  rights: {
    bp: number;
    elec: number;
    download: number;
    movie: number;
    pay: number;
    hd5: number;
    no_reprint: number;
    autoplay: number;
    ugc_pay: number;
    is_cooperation: number;
    ugc_pay_preview: number;
    no_background: number;
    clean_mode: number;
    is_stein_gate: number;
  };
  owner: {
    mid: number;
    name: string;
    face: string;
  };
  stat: {
    aid: number;
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    now_rank: number;
    his_rank: number;
    like: number;
    dislike: number;
    evaluation: string;
    argue_msg: string;
  };
  dynamic: string;
  cid: number;
  dimension: {
    width: number;
    height: number;
    rotate: number;
  };
  no_cache: boolean;
  pages: Array<{
    cid: number;
    page: number;
    from: number;
    part: string;
    duration: number;
    vid: string;
    weblink: string;
    dimension: {
      width: number;
      height: number;
      rotate: number;
    };
  }>;
  subtitle: {
    allow_submit: boolean;
    list: [];
  };
  user_garb: {
    url_image_ani_cut: string;
  };
}

@Injectable()
export class ReplayService {
  constructor(
    @InjectModel(ModDocument.name) public modModel: Model<ModDocument>,
    @InjectModel(ReplayDocument.name)
    public readonly replayModel: Model<ReplayDocument>,
    private httpService: HttpService,
    private fileService: FileService,
  ) {}

  async getOrCreateReplay(bvid: string) {
    const res = await this.replayModel.findOne({ bvid });
    if (res) {
      return res;
    }

    return this.creteReplayFromBvid(bvid);
  }

  async creteReplayFromBvid(
    bvid: string,
    modId?: string,
  ): Promise<ReplayDocument> {
    let mod: ModDocument;
    if (modId) {
      mod = await this.modModel.findById(modId);
      if (!mod) {
        throw new NotFoundException('未找到相关模组');
      }
    }

    const res = await this.httpService
      .get<BilibiliApiRes<BilibiliViewData>>(
        BILIBILI_API_ENDPOINT + encodeURI(bvid),
      )
      .toPromise()
      .then(res => {
        return res.data;
      });

    if (res.code !== 0) {
      if (res.code === -400) {
        throw new BadRequestException(`无法找到视频，请检查bv号是否存在`);
      }

      throw new BadRequestException(res.message);
    }

    const viewData = res.data;

    // const coverUrl = await Promise.all(
    //   viewData.image_urls.map(imageUrl => this.fileService.fetchImageAndUpload(imageUrl))
    // )
    // this.logger.debug(mod.id + '号booth模组imageUrls处理完毕')
    const coverUrl = await this.fileService.fetchImageAndUpload(viewData.pic);
    const ownerFace = await this.fileService.fetchImageAndUpload(
      viewData.owner.face,
    );

    const nReplay = new this.replayModel({
      bvid: viewData.bvid,
      duration: viewData.duration,
      owner: {
        mid: viewData.owner.mid,
        name: viewData.owner.name,
        face: ownerFace,
      },
      videos: viewData.videos,
      pages: viewData.pages,
      title: viewData.title,
      coverUrl,
      description: viewData.desc,
      mod: modId ? mod._id : undefined,
    });

    await nReplay.save();

    return nReplay;

    // text = res.text.encode('utf-8')
    // result = json.loads(text)['data']

    // image_name, image = load_image_from_url(result['pic'])
    // instance.cover.save(image_name, files.File(image))
    // instance.title = result['title']
    // instance.save()
  }

  async updateReplay(bvid: string, modId?: string) {
    const replay = await this.getOrCreateReplay(bvid);
    replay.mod = new ObjectId(modId);
    await replay.save();

    return replay;
  }
}
