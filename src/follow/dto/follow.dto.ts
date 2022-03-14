import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FollowDto {
    @IsNotEmpty()
    @IsString()
    readonly targetName: string;

    @IsNotEmpty()
    @IsString()
    readonly targetId: string;
  }
