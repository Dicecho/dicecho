import { Injectable, Logger } from '@nestjs/common';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { validate } from 'class-validator';
import {
  OperationLog as OperationLogDocument,
  AdminLog as AdminLogDocument,
} from '@app/operationLog/schemas';
import { CreateLogDto, CreateAdminLogDto } from '../dto';
import _ from 'lodash';


@Injectable()
export class OperationLogService {
  constructor(
    @InjectModel(OperationLogDocument.name) public operationLogModel: Model<OperationLogDocument>,
    @InjectModel(AdminLogDocument.name) public adminLogModel: Model<AdminLogDocument>,
  ) {}
  private readonly logger = new Logger(OperationLogService.name);

  async createOperationLog(createOperationDto: CreateLogDto, user: UserDocument) {
    if (createOperationDto.changedKeys.length === 0) {
      return;
    }

    const log = new this.operationLogModel({
      targetName: createOperationDto.targetName,
      targetId: createOperationDto.targetId,
      operator: user._id,
      changedKeys: createOperationDto.changedKeys,
      before: createOperationDto.before,
      after: createOperationDto.after,
    })

    await log.save()

    return log;
  }

  async createAdminLog(createAdminLogDto: CreateAdminLogDto, user: UserDocument) {
    validate(createAdminLogDto);
    const adminLog = new this.adminLogModel({
      operator: user._id,
      log: createAdminLogDto.log,
      message: createAdminLogDto.message,
      snapshot: createAdminLogDto.snapshot,
      type: createAdminLogDto.type,
    })

    await adminLog.save()

    return adminLog
  }
}