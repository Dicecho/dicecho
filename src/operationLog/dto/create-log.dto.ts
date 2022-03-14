import {
  IsOptional,
  IsString,
  IsObject,
  IsArray,
} from 'class-validator';

export class CreateLogDto {
  @IsString()
  readonly targetName: string;

  @IsString()
  readonly targetId: string;

  @IsArray()
  readonly changedKeys: Array<string>;

  @IsOptional()
  @IsObject()
  readonly before: any;

  @IsOptional()
  @IsObject()
  readonly after: any;
}
