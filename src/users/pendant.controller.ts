import { Controller, Param, Post, Body, Get, Put, Query } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { PendantService } from './services';
import { getObjectId } from '@app/utils';
import { PendantSerializer } from '@app/users/serializers';
import { PendantCreateDto, PendantSendDto } from './dto';
import { Roles } from '@app/auth/decorators';
import { Role } from '@app/auth/roles.enum';
import { RateService } from '@app/rate/rate.service';
import { UserDecorator, serialize, ConflictException, NotFoundException, BadRequestException } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import _ from 'lodash';
import { Public } from '@app/auth/decorators/public.decorator';
import { EventService } from '@app/event/services';
import { Pendant } from './schemas';


@Controller('pendant')
export class PendantController {
  constructor(
    private pendantService: PendantService,
    private eventService: EventService,
    private rateService: RateService,
  ) {}

  @Roles(Role.Superuser)
  @Get()
  async list(
    @UserDecorator() user: UserDocument,
  ) {
    const pendants = await this.pendantService.pendantModel
      .find()

    return serialize(PendantSerializer, pendants)
  }

  @Roles(Role.Superuser)
  @Post()
  async create(
    @Body() pendantCreateDto: PendantCreateDto,
  ) {
    const pendant = await this.pendantService.createPendant(
      pendantCreateDto.name,
      pendantCreateDto.url,
    )

    return serialize(PendantSerializer, pendant)
  }

  @Roles(Role.Superuser)
  @Post('send')
  async send(
    @Body() pendantSendDto: PendantSendDto,
  ) {
    const pendant = await this.pendantService.pendantModel.findOne({ _id: new ObjectId(pendantSendDto.pendantId) })

    if (!pendant) {
      throw new NotFoundException('未找到挂饰')
    }

    const user = await this.pendantService.userModel.findOne({ _id: new ObjectId(pendantSendDto.userId) })

    if (!user) {
      throw new NotFoundException('未找到用户')
    }
  
    await this.pendantService.sendPendants(user._id, [pendant._id])
  }


  @Get('self')
  async self(
    @UserDecorator() user: UserDocument,
  ) {
    const result = await this.pendantService.userModel
      .findOne({ _id: user._id })
      .populate('pendants')

    const pendants = result.pendants as Pendant[];
    // const result = await this.pendantService.pendantModel.find({ _id: { $in: user.pendants.map(pendant => pendant._id) } })

    return serialize(PendantSerializer, pendants)
  }

  @Put(':pendantId/active')
  async active(
    @Param('pendantId') pendantId: string,
    @UserDecorator() user: UserDocument,
  ) {
    const pendant = await this.pendantService.pendantModel.findOne({ _id: new ObjectId(pendantId) });
    await this.pendantService.activePendant(user, pendant);
  }

  @Put('inactive')
  async inactive(
    @UserDecorator() user: UserDocument,
  ) {
    await this.pendantService.inactivePendant(user._id);
  }

  @Public()
  @Get(':pendantId')
  async retrieve(
    @Param('pendantId') pendantId: string,
  ) {
    const pendant = await this.pendantService.pendantModel.findOne({ _id: new ObjectId(pendantId) });
    return serialize(PendantSerializer, pendant)
  }

}
