import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AccessLevel, RateType, RemarkContentType } from '../constants';
import { RateView } from '../schemas';

export class UpdateRateDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, {
    message: '评分最小为0分',
  })
  @Max(10, {
    message: '评分最大为10分',
  })
  readonly rate: number;

  @IsOptional()
  @IsEnum(RateType)
  readonly type: RateType;

  @IsOptional()
  @IsString()
  readonly remark: string;

  @IsOptional()
  @IsEnum(RateView)
  readonly view: RateView;

  @IsOptional()
  @IsBoolean()
  readonly isAnonymous: boolean;

  @IsOptional()
  @IsBoolean()
  readonly isLocked: boolean;

  @IsOptional()
  @IsEnum(AccessLevel)
  readonly accessLevel: AccessLevel;

  @IsOptional()
  @IsEnum(RemarkContentType)
  readonly remarkType: RemarkContentType;

  @IsOptional()
  @IsJSON()
  readonly richTextState: string;
}
