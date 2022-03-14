import { IModDto } from '@app/mod/dto';
import { IRateDto } from '@app/rate/dto';
import { ISimpleUser } from '@app/users/serializers';

export enum BlockTargetName {
  Mod = 'Mod',
  User = 'User',
  Rate = 'Rate',
}

interface BaseBlock {
  _id: string;
  targetName: BlockTargetName;
}

interface ModBlock extends BaseBlock {
  targetName: BlockTargetName.Mod;
  target: IModDto;
}

interface RateBlock extends BaseBlock {
  targetName: BlockTargetName.Rate;
  target: IRateDto;
}

interface UserBlock extends BaseBlock {
  targetName: BlockTargetName.User;
  target: ISimpleUser;
}


export type IBlockDto = ModBlock | RateBlock | UserBlock;
