import { Module } from '@nestjs/common';
import { MailgunModule } from '@nextnm/nestjs-mailgun';
import { UsersService, PendantService } from './services';
import { MongooseModule } from '@nestjs/mongoose';
import { EventModule } from '@app/event/event.module';
import { RateModule } from '@app/rate/rate.module';
import { User, UserSchema, Follow, FollowSchema, Pendant, PendantSchema } from './schemas';
import { PendantController } from './pendant.controller';
import { UserController } from './users.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Pendant.name, schema: PendantSchema },
    ]),
    MailgunModule.forAsyncRoot({
      useFactory: (configService: ConfigService) => {
        return {
          DOMAIN: configService.get<string>('MAIL_DOMAIN'),
          API_KEY: configService.get<string>('MAIL_API_KEY'),
          HOST: configService.get<string>('MAIL_HOST'),
        };
      },
      inject: [ConfigService]
    }),
    EventModule,
    RateModule,
  ],
  controllers: [UserController, PendantController],
  providers: [UsersService, PendantService],
  exports: [UsersService, PendantService],
})
export class UsersModule {}
