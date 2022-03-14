import { Type } from 'class-transformer';
import {
  IsBoolean, IsEnum, IsJSON, IsNumber, IsOptional,
  IsString, Max, Min
} from 'class-validator';
import { AccessLevel, RateType, RemarkContentType } from '../constants';
import { RateView } from '../schemas';

export class PostRateDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, {
    message: '评分无法为负数',
  })
  @Max(10, {
    message: '评分最大为10分',
  })
  readonly rate: number;

  @IsEnum(RateType)
  readonly type: RateType;

  @IsEnum(RemarkContentType)
  readonly remarkType: RemarkContentType;

  @IsOptional()
  @IsJSON()
  readonly richTextState: string;

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
  @IsEnum(AccessLevel)
  readonly accessLevel: AccessLevel;
}
