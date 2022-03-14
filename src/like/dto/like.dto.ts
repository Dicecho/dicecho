import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeAttitude } from '../schemas';

export class LikeDto {
  @IsNotEmpty()
  @IsString()
  readonly targetName: string;

  @IsNotEmpty()
  @IsString()
  readonly targetId: string;
}

export class DeclareDto {
  @IsNotEmpty()
  @IsString()
  readonly targetName: string;

  @IsNotEmpty()
  @IsString()
  readonly targetId: string;

  @IsNotEmpty()
  @IsEnum(LikeAttitude)
  readonly attitude: LikeAttitude;
}
