import { Injectable, HttpService, Logger } from '@nestjs/common';
import { OSSService } from '@app/oss/oss.service';
import { ConfigService } from '@nestjs/config';
import { timeoutPromise } from '@app/core';
import { retry } from 'ts-retry-promise';
import moment from 'moment';
import stream from 'stream';
import { v4 } from 'uuid';

@Injectable()
export class FileService {
  constructor(
    private httpService: HttpService,
    private oSSService: OSSService,
    private configService: ConfigService,
  ) {}
  private readonly logger = new Logger(FileService.name);

  private getUrlExtension(url: string) {
    return url.split(/[#?]/)[0].split('.').pop().trim();
  }

  async fetchImageAndUpload(url: string): Promise<string> {
    // this.logger.debug('正在获取' + url)
    const buffer = await retry(
      () => this.httpService.get(url, { responseType: 'arraybuffer' })
      .toPromise()
      .then(response => {
        return Buffer.from(response.data, 'base64');
      }),
      {
        retries: 3,
        logger: (msg) => this.logger.debug(`${url}获取失败，准备重试：${msg}`),
      }
    )
  
    const imageStream = new stream.PassThrough();
    imageStream.end(buffer);
  
    const extension = this.getUrlExtension(url) 
    const filePrefix = this.configService.get<string>('S3_FILE_PREFIX')
    const filename = `${moment().format('HHmmss')}${Math.floor(Math.random() * 100)}${v4()}.${extension}`;
    const imgPath = `${filePrefix}${moment().format('YYYYMMDD')}`;
    const target = imgPath + '/' + filename;
  
    // this.logger.debug(`${url}获取完毕，准备上传到oss`)
    const uploadResult = await retry(
      () => this.oSSService.uploadAsStream(target, imageStream),
      {
        timeout: 15 * 1000,
        retries: 3,
        logger: (msg) => this.logger.debug(`${url}上传到oss失败，准备重试：${msg}`),
      },
    )
    // this.logger.debug(`${url}上传到oss完毕`)
    return uploadResult.url;
  }
}
