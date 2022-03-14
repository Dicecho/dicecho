import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  Get,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OSSService } from '@app/oss/oss.service';
import { UserDecorator } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { UploadFromUrlDto } from './dto/upload-form-url.dto';
import { Public } from '@app/auth/decorators/public.decorator';
import { FileService } from './file.service';
import { ConfigService } from '@nestjs/config';

@Controller('file')
// @Public()
export class FileController {
  constructor(
    private readonly oSSService: OSSService,
    private readonly fileService: FileService,
    private readonly configService: ConfigService,
  ) {}

  @Get('assume')
  public async getOSSPermission(
    @UserDecorator() user: UserDocument,
  ) {

    const S3_ALIAS_HOST = this.configService.get<string>('S3_ALIAS_HOST');
    const S3_BUCKET = this.configService.get<string>('S3_BUCKET');
    const S3_REGION = this.configService.get<string>('S3_REGION');
    const S3_SECURE = this.configService.get<boolean>('S3_SECURE', false);
    const path = `mod/${user._id.toHexString()}`;
    const policy = {
      "Statement": [
        {
          "Action": [
            "oss:PutObject"
          ],
          "Effect": "Allow",
          "Resource": [
            `acs:oss:${S3_REGION}:*:${S3_BUCKET}/${path}/*`
          ]
        }
      ],
      "Version": "1"
    };

    const token = await this.oSSService.ossSts.assumeRole(
      'acs:ram::1287876184573765:role/aliyunosstokengeneratorrole',
      policy,
      1200,
      user._id.toHexString(),
    );

    return {
      ...token.credentials,
      Domain: S3_ALIAS_HOST || `${S3_BUCKET}.${S3_REGION}.aliyuncs.com`,
      Path: path,
      Secure: S3_SECURE,
      Bucket: S3_BUCKET,
      Region: S3_REGION,
      Cname: S3_ALIAS_HOST,
    }
  }

  /**
   * 多文件上传oss
   */
  @Post('upload')
  // @Public()
  @UseInterceptors(FilesInterceptor('file'))
  public async uploadOSS(@UploadedFiles() files) {
    const result = await this.oSSService.upload(files[0]);
    return {
      url: result[0].src
    };
  }

  /**
   * 从url上传图片
   */
  // @Public()
  @Post('upload_from_url')
  public async uploadOssFromUrl(
    @Body() uploadFromUrlDto: UploadFromUrlDto
  ) {
    return await this.fileService.fetchImageAndUpload(uploadFromUrlDto.url);
  }

}
