import { Module, HttpModule } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { OSSModule } from '@app/oss/oss.module';
import { ConfigService } from '@nestjs/config';

@Module({
	imports: [
    HttpModule.register({
      timeout: 15 * 1000,
      maxRedirects: 5,
    }),
		OSSModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        client: {
          endpoint: configService.get<string>('S3_ALIAS_HOST', configService.get<string>('S3_ENDPOINT')),
          accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
          accessKeySecret: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          bucket: configService.get<string>('S3_BUCKET'),
          region: configService.get<string>('S3_REGION'),
          internal: true,
          secure: configService.get<boolean>('S3_SECURE', false),
          cname: configService.get<string>('S3_ALIAS_HOST') !== undefined,
          timeout: '90s',
        },
        filePrefix: configService.get<string>('S3_FILE_PREFIX')
      }),
      inject: [ConfigService]
    })
	],
  controllers: [FileController],
  providers: [
    FileService,
  ],
  exports: [
    FileService,
  ],
})
export class FileModule {}
