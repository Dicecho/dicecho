import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ReportClassification } from '../constants';

export class ReportDto {
  @IsNotEmpty()
  @IsString()
  readonly targetName: string;

  @IsNotEmpty()
  @IsString()
  readonly targetId: string;

  @IsEnum(ReportClassification)
  readonly classification: ReportClassification;

  @IsNotEmpty()
  @IsString()
  readonly reason: string;
}
