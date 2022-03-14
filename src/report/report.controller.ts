import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserDecorator } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { ReportService } from './report.service';
import { ReportDto, AppealDto } from './dto';

@Controller('report')
export class ReportController {
  constructor(
    private reportService: ReportService,
  ) {}

  @Post()
  async report(
    @Body() reportDto: ReportDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.reportService.reportBy(
      reportDto.targetName,
      reportDto.targetId,
      user._id.toString(),
      reportDto.classification,
      reportDto.reason,
    );
  }

  @Post('appeal')
  async appeal(
    @Body() appealDto: AppealDto,
    @UserDecorator() user: UserDocument,
  ): Promise<any> {
    await this.reportService.appealBy(
      appealDto.targetName,
      appealDto.targetId,
      user._id.toString(),
      appealDto.reason,
    );
  }
}
