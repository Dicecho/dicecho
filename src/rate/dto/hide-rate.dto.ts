import { IsOptional, IsString } from 'class-validator';

export class HiddenRateDto {
  @IsString()
  readonly log: string;

  @IsOptional()
  @IsString()
  readonly message: string;
}
