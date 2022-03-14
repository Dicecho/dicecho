import { Controller, Param, Post, Body, Get, Put, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { 
  EmailRegisterUserDto,
  ChangePasswordDto,
  UpdateProfileDto,
  RescuePasswordDto,
  SendRescueCodeDto,
  CheckRescueCodeDto,
  EmailVertifyDto,
  CheckEmailVertifyDto,
} from './dto';
import { ObjectId } from 'mongodb';
import { SearchQuery } from '@app/search/dto';
import { Roles } from '@app/auth/decorators';
import { Role } from '@app/auth/roles.enum';
import { UsersService } from './services';
import { ProfileSerializer } from '@app/users/serializers';
import { Public } from '@app/auth/decorators/public.decorator'; 
import { UserDecorator, NotFoundException, BadRequestException, ConflictException, serialize, PageableQuery, ForbiddenException } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { IPorileApiResponse, IUserDto } from '@app/interfaces/shared/api';
import { MailgunService } from '@nextnm/nestjs-mailgun';
import { resetPassword, VertifyEmail } from '@app/email-template'
import { ConfigService } from '@nestjs/config';
import crypto from "crypto";
import ejs from 'ejs';
import _ from 'lodash';
import { DAY, WEEK, MONTH } from '@app/utils';
import moment from 'moment';

@Controller('user')
export class UserController {
  constructor(
    private usersService: UsersService,
    private mailgunService: MailgunService,
    private configService: ConfigService,
  ) {}


  @Roles(Role.Superuser)
  @Get('analysis')
  async analysis(
  ) {
    const getCountQuery = (createDay: number) => {
      return {
        verified: true,
        createdAt: { $gte: new Date(createDay), $lt:  new Date(createDay + DAY) },
      }
    }
  
    const getKeepQuery = (today: number, createDay: number) => {
      return {
        verified: true,
        createdAt: { $gte: new Date(createDay), $lt:  new Date(createDay + DAY) },
        lastActivityAt: { $gte: new Date(today) },
      }
    }

    const todayStart = new Date(new Date().toLocaleDateString()).getTime()

    const getKeepData = async (today: number, startDay: number) => {
      const [registerCount, keepCount] = await Promise.all([
        this.usersService.userModel.count(getCountQuery(startDay)),
        this.usersService.userModel.count(getKeepQuery(today, startDay)),
      ])

      return {
        registerCount,
        keepCount,
        rate: (keepCount/registerCount).toFixed(2)
      }
    }
  
    const data = await Promise.all(
      [...Array(30).keys()].map((index) => 
        (async() => {
          const today = todayStart - (index * DAY);
          const yesterday = today - DAY;
          const weekAgo = today - WEEK;
          const monthAgo = today - MONTH;
          const key = moment(today).format('YYYY-MM-DD')

          const data = await Promise.all([
            getKeepData(today, yesterday),
            getKeepData(today, weekAgo),
            getKeepData(today, monthAgo),
          ])

          return {
            date: key,
            '1kc': data[0].keepCount,
            '1rc': data[0].registerCount,
            '1r': data[0].rate,
            '7kc': data[1].keepCount,
            '7rc': data[1].registerCount,
            '7r': data[1].rate,
            '30kc': data[2].keepCount,
            '30rc': data[2].registerCount,
            '30r': data[2].rate,
          }
        })()
      ),
    )
    return data
  }

  @Get('search')
  @Public()
  async search(
    @Query() searchQuery: SearchQuery,
    @UserDecorator() user?: UserDocument,
  ) {
    const { page, pageSize } = searchQuery;
    const result = await this.usersService.search(searchQuery);
    let userIds: Array<string> = result.body.hits.hits.map(item => item._id);

    const hasNext = userIds.length > pageSize;
    userIds = userIds.length === 1 || !hasNext
        ? userIds
        : userIds.slice(0, userIds.length - 1);
    
    const users = await this.usersService.userModel.find({
      _id: { $in: userIds.map(id => new ObjectId(id)) },
    })

    const results = userIds.map((id) => users.find(m => m._id.toString() === id))

    const ctx = {
      user,
    }
  
    if (user) {
      Object.assign(ctx, {
        ...await this.usersService.getProfileCtx(user._id.toHexString()),
      })
    }
  
    return {
      totalCount: result.body.hits.total.value,
      page: page,
      pageSize: pageSize,
      data: serialize(ProfileSerializer, results) as Array<IUserDto>,
      hasNext,
    };
  }

  @Post('register/email')
  @Public()
  async emailRegister(@Body() registerDto: EmailRegisterUserDto) {
    const checkUser = await this.usersService.userModel.findOne({ email: registerDto.email });
    if (checkUser) {
      if (checkUser.verified) {
        throw new ConflictException('此email已被注册，请您直接登录')
      }
      checkUser.verification = crypto.randomBytes(20).toString("hex"),
      await checkUser.save();
      const url = `${this.configService.get<string>('PROTOCOL')}://${this.configService.get<string>('WEBSITE')}/account/vertify?email=${checkUser.email}&vertifyCode=${checkUser.verification}`
      await this.mailgunService.sendEmail({
        from: '骰声回响 <no-reply@dicecho.com>',
        to: checkUser.email,
        subject: '激活账号',
        html: ejs.render(
          VertifyEmail, 
          { link: url },
        ),
      })
      return
    }
  
    const user = await this.usersService.createUser(registerDto.email)
    
    const url = `${this.configService.get<string>('PROTOCOL')}://${this.configService.get<string>('WEBSITE')}/account/vertify?email=${user.email}&vertifyCode=${user.verification}`
    await this.mailgunService.sendEmail({
      from: '骰声回响 <no-reply@dicecho.com>',
      to: user.email,
      subject: '激活账号',
      html: ejs.render(
        VertifyEmail, 
        { link: url },
      ),
    })
  }

  @Post('check-vertify')
  @Public()
  async checkVertifyEmail(@Body() checkEmailVertifyDto: CheckEmailVertifyDto) {
    const user = await this.usersService.userModel.findOne({ email: checkEmailVertifyDto.email });
    if (!user) {
      throw new ConflictException('此用户不存在')
    }

    if (user.verification !== checkEmailVertifyDto.vertifyCode) {
      throw new BadRequestException('账号验证码错误，请重新获取邮件')
    }
  }

  @Post('vertify')
  @Public()
  async vertifyEmail(
    @Body() emailVertifyDto: EmailVertifyDto,
  ): Promise<IPorileApiResponse>  {
    const user = await this.usersService.emailVertify(emailVertifyDto)
    return serialize(ProfileSerializer, user) as IUserDto
  }

  @ApiBearerAuth()
  @Get('profile')
  async profile(
    @UserDecorator() user: UserDocument
  ): Promise<IPorileApiResponse>  {
    return serialize(ProfileSerializer, user, { user }) as IUserDto
  }

  @Public()
  @Get(':uuid/followers')
  async followers(
    @Param('uuid') uuid: string,
    @Query() query: PageableQuery,
    @UserDecorator() user?: UserDocument,
  ) {
    const { pageSize, page, sort = { _id: -1 } } = query;

    const target = await this.usersService.userModel.findById(uuid);

    if (!target) {
      throw new NotFoundException('未找到指定用户')
    }

    const filter = { following: target._id }

    const result = await this.usersService.followModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate('follower');

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    const ctx = {
      user,
    }

    if (user) {
      Object.assign(ctx, {
        ...await this.usersService.getProfileCtx(user._id.toHexString()),
      })
    }

    return {
      totalCount: await this.usersService.followModel.countDocuments(filter),
      page,
      pageSize,
      data: serialize(ProfileSerializer, returnData.map(data => data.follower) as UserDocument[], ctx) as Array<IUserDto>,
      hasNext,
    };
  }

  @Public()
  @Get(':uuid/followings')
  async followings(
    @Param('uuid') uuid: string,
    @Query() query: PageableQuery,
    @UserDecorator() user?: UserDocument,
  ) {
    const { pageSize, page, sort = { _id: -1 } } = query;

    const target = await this.usersService.userModel.findById(uuid);

    if (!target) {
      throw new NotFoundException('未找到指定用户')
    }

    const filter = { follower: target._id }

    const result = await this.usersService.followModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize + 1)
      .populate('following');

    const hasNext = result.length > pageSize;
    const returnData =
      result.length === 1 || !hasNext
        ? result
        : result.slice(0, result.length - 1);

    const ctx = {
      user,
    }

    if (user) {
      Object.assign(ctx, {
        ...await this.usersService.getProfileCtx(user._id.toHexString()),
      })
    }

    return {
      totalCount: await this.usersService.followModel.countDocuments(filter),
      page,
      pageSize,
      data: serialize(ProfileSerializer, returnData.map(data => data.following) as UserDocument[], ctx) as Array<IUserDto>,
      hasNext,
    };
  }

  @Post(':uuid/follow')
  async follow(
    @Param('uuid') uuid: string,
    @UserDecorator() user: UserDocument,
  ) {
    await this.usersService.followUser(user._id.toHexString(), uuid)
  }

  @Post(':uuid/unfollow')
  async unfollow(
    @Param('uuid') uuid: string,
    @UserDecorator() user: UserDocument,
  ) {
    await this.usersService.unfollowUser(user._id.toHexString(), uuid)
  }

  @Public()
  @Get(':uuid/profile')
  async account(
    @Param('uuid') uuid: string,
    @UserDecorator() user?: UserDocument,
  ): Promise<IPorileApiResponse> {
    const account = await this.usersService.userModel.findById(uuid);

    if (!account) {
      throw new NotFoundException('未找到指定用户')
    }

    const ctx = {
      user,
    }

    if (user) {
      Object.assign(ctx, {
        ...await this.usersService.getProfileCtx(user._id.toHexString()),
      })
    }

    return serialize(ProfileSerializer, account, ctx) as IUserDto
  }

  @Put('profile')
  async updateProfile(
    @UserDecorator() user: UserDocument,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<IPorileApiResponse> {
    const changedKeys = Object.keys(updateProfileDto)
      .map((key) => ({ key, value: !_.isEqual(updateProfileDto[key], user[key]) }))
      .reduce((a, b) => b.value ? [...a, b.key] : a, []) as string[]

    if (changedKeys.length === 0) {
      return serialize(ProfileSerializer, user, { user }) as IUserDto
    }

    if (changedKeys.findIndex(key => key === 'nickName') !== -1) {
      const checkUser = await this.usersService.userModel.findOne({ nickName: updateProfileDto.nickName });
      if (checkUser) {
        throw new ConflictException('此昵称已被占用')
      }
    }

    await this.usersService.userModel.updateOne(
      { _id: user._id },
      updateProfileDto,
      { upsert: true }
    )

    const newUser = await this.usersService.userModel.findById(user._id);

    return serialize(ProfileSerializer, newUser, { user }) as IUserDto
  }

  @Post('send-rescue')
  @Public()
  async sendRescueCode(
    @Body() sendRescueCodeDto: SendRescueCodeDto,
  ) {
    const account = await this.usersService.userModel.findOne({ email: sendRescueCodeDto.email })

    if (!account) {
      throw new NotFoundException('未找到指定账户')
    }

    account.rescueCode = crypto.randomBytes(20).toString("hex");
    account.rescueCodeExpires = new Date(Date.now() + 15 * 60 * 1000)
    await account.save()

    const url = `${this.configService.get<string>('PROTOCOL')}://${this.configService.get<string>('WEBSITE')}/account/forget?email=${account.email}&rescueCode=${account.rescueCode}`
    await this.mailgunService.sendEmail({
      from: '骰声回响 <no-reply@dicecho.com>',
      to: account.email,
      subject: '重置您的密码',
      html: ejs.render(
        resetPassword, 
        { nickcname: account.nickName, link: url },
      ),
    })
  }

  @Post('check-rescue')
  @Public()
  async checkRescueCode(
    @Body() checkRescueCodeDto: CheckRescueCodeDto,
  ) {
    const account = await this.usersService.userModel.findOne({ email: checkRescueCodeDto.email })

    if (!account) {
      throw new NotFoundException('未找到指定用户')
    }

    if (!account.rescueCode || account.rescueCode !== checkRescueCodeDto.rescueCode) {
      throw new BadRequestException('救援码错误')
    }

    if (!account.rescueCodeExpires || account.rescueCodeExpires.getTime() < Date.now()) {
      throw new BadRequestException('救援码已过期')
    }
  }

  @Post('rescue')
  @Public()
  async rescuePassword(
    @Body() rescuePasswordDto: RescuePasswordDto,
  ) {
    const account = await this.usersService.userModel.findOne({ email: rescuePasswordDto.email })

    if (!account) {
      throw new NotFoundException('未找到指定用户')
    }

    if (!account.rescueCode || account.rescueCode !== rescuePasswordDto.rescueCode) {
      throw new BadRequestException('救援码错误')
    }

    if (!account.rescueCodeExpires || account.rescueCodeExpires.getTime() < Date.now()) {
      throw new BadRequestException('救援码已过期')
    }

    account.rescueCodeExpires = new Date(Date.now() - 15 * 60 * 1000)
    account.password = rescuePasswordDto.newPassword
    await account.save()
  }

  @Put('password')
  async changePassword(
    @UserDecorator() user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    if (!user.comparePassword(changePasswordDto.oldPassword)) {
      throw new BadRequestException('旧密码输入错误');
    }
    user.password = changePasswordDto.newPassword;
    await user.save();
  }
}
