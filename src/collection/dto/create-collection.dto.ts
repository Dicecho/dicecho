import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollectionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20, { message: '收藏夹名字最大20字' })
  readonly name: string;
}
