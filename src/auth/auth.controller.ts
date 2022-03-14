import { Controller, Req, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, RefreshTokenDto } from './dto';
import { UsersService } from '@app/users/services';
import { Request } from 'express';
import { NotFoundException, BadRequestException } from '@app/core';
import { ILocalApiResponse, IRefreshApiResponse } from '@app/interfaces/shared/api';
import { Public } from '@app/auth/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('local')
  @Public()
  async local(@Req() req: Request, @Body() loginUserDto: LoginUserDto): Promise<ILocalApiResponse> {
    const user = await this.usersService.findUserByEmail(loginUserDto.email)

    if (!user.comparePassword(loginUserDto.password)) {
      throw new NotFoundException('错误的账号或者密码');
    }

    if (!user.verified) {
      throw new BadRequestException('该账号尚未激活');
    }

    return await this.authService.login(user, req)
  }

  @Post('refresh-token')
  @Public()
  async refreshToken(@Req() req: Request, @Body() refreshTokenDto: RefreshTokenDto): Promise<IRefreshApiResponse> {
    const accessToken = await this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
    return {
      accessToken,
      refreshToken: refreshTokenDto.refreshToken,
    }
  }

  @Post('logout')
  @Public()
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }
}
