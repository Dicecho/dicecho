import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BlockTargetName } from '../interface';

export class BlockDto {
    @IsEnum(BlockTargetName)
    readonly targetName: BlockTargetName;

    @IsNotEmpty()
    @IsString()
    readonly targetId: string;
  }
