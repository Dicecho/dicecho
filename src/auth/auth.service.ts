import { User as UserDocument } from '@app/users/schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { v4 } from 'uuid';
import { Model } from 'mongoose'
import { ObjectId } from 'mongodb';
import { JwtPayload } from './auth.interfaces';
import { Request } from 'express';
import { BaseException, BadRequestException, NotFoundException } from '@app/core';
import { getIp, getBrowserInfo, getCountry } from '@app/utils/request';
import { AuthErrorCode } from '@app/interfaces/shared/errorcode/auth';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(UserDocument.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async createAccessToken(payload: JwtPayload): Promise<string> {
    const options = { 
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRESIN'),
    };
    return this.jwtService.sign(payload, options);
  }

  async createRefreshToken(userId: string, ip: string, browser: string, country: string) {
    const refreshToken = new this.refreshTokenModel({
      user: userId,
      refreshToken: v4(),
      ip,
      browser,
      country,
      valid: true,
      expiredAt: new Date(Date.now() + 30 * 24 * 3600 * 1000)
    });

    await refreshToken.save();
    return refreshToken.refreshToken;
  }

  async findRefreshToken(token: string) {
    const refreshToken = await this.refreshTokenModel.findOne({ 
      refreshToken: token,
      valid: true,
      expiredAt: { '$gte': new Date() }
    });

    if (!refreshToken) {
      throw new BaseException('refresh token 不可用', HttpStatus.UNAUTHORIZED, AuthErrorCode.REFRESH_TOKEN_DISABLES);
    }
    return refreshToken.user;
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async login(user: UserDocument, req: Request): Promise<{
    accessToken: string,
    refreshToken: string,
  }> {
    if (user.blockExpires.getTime() > (new Date().getTime() + 1000)) {
      throw new BadRequestException('用户状态异常，请联系管理员');
    }

    const payload: JwtPayload = { sub: user._id.toHexString(), roles: user.roles };
    user.lastLoginAt = new Date()
    await user.save()
    const accessToken = await this.createAccessToken(payload)

    const a = this.jwtService.decode(accessToken)
    return {
      accessToken,
      refreshToken: await this.createRefreshToken(
        user._id.toString(),
        getIp(req),
        getBrowserInfo(req),
        getCountry(req),
      )
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const userId = await this.findRefreshToken(refreshToken);
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.blockExpires.getTime() > (new Date().getTime() + 1000)) {
      throw new BadRequestException('用户状态异常，请联系管理员');
    }

    user.lastActivityAt = new Date()
    await user.save()
    const payload: JwtPayload = { sub: user._id.toHexString(), roles: user.roles };
    return this.createAccessToken(payload);
  }

  async logout(refreshToken: string): Promise<any> {
    await this.refreshTokenModel.updateOne(
      { refreshToken }, 
      { valid: false },
    );
  }
}