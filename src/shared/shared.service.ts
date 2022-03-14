import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'
import { 
  Config as ConfigDocument,
} from '@app/shared/config.schema';

@Injectable()
export class SharedService {
  constructor(
    @InjectModel(ConfigDocument.name) public configModel: Model<ConfigDocument>,
  ) {}
}