import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APPExceptionFilter } from '@app/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ShredModule } from './shared/shared.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { ModModule } from './mod/mod.module';
import { RateModule } from './rate/rate.module';
import { CollectionModule } from './collection/collection.module';
import { OperationLogModule } from './operationLog/log.module';
import { ForumModule } from './forum/forum.module';
import { ReplayModule } from './replay/replay.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ApiResponseInterceptor } from '@app/utils/interceptor';
import { RolesGuard } from '@app/auth/roles.guard';
import { AppAuthGuard } from '@app/auth/auth.guard';
import { validate } from './env.validation';
import { ConfigService } from '@nestjs/config';
import { SearchModule } from './search/search.module';
import { FileModule } from './file/file.module';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { LogLevel } from '@sentry/types';
import { NotificationModule } from './notification/notification.module';
import { TagModule } from './tag/tag.module';
import { UserLikeModule } from './user-like/user-like.module';
import { EventModule } from './event/event.module';
import { RichtextModule } from './richtext/richtext.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      validate,
      cache: true,
      isGlobal: true,
      envFilePath: ['.env.local', '.env.prod', '.env'],
    }),
    SentryModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          enabled: true,
          dsn: configService.get<string>('SENTRY_DSN'),
          debug: configService.get<string>('ENV') === 'dev',
          environment: configService.get<string>('ENV'),
          // release: 'some_release' | null, // must create a release in sentry.io dashboard
          logLevel: LogLevel.Debug, //based on sentry.io loglevel //
        }
      },
      inject: [ConfigService],
    }),
    SearchModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get<string>('ES_ENABLED') === 'true',
        node: configService.get<string>('ES_URL'),
        auth: {
          username: configService.get<string>('ES_USERNAME'),
          password: configService.get<string>('ES_PASSWORD'),
        }
      }),
      inject: [ConfigService]
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<string>('MONGO_URI'),
        };
      },
      inject: [ConfigService]
    }),
    ModModule,
    RateModule,
    AuthModule,
    UsersModule,
    FileModule,
    LikeModule,
    CommentModule,
    NotificationModule,
    ForumModule,
    ShredModule,
    TagModule,
    UserLikeModule,
    OperationLogModule,
    ReplayModule,
    CollectionModule,
    EventModule,
    RichtextModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: APPExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AppAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
