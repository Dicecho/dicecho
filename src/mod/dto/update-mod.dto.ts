import { IsNumber, IsOptional, IsString, ValidateNested, IsNotEmpty, IsArray, ArrayMinSize, IsUrl, ValidateIf, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { LanguageCodes } from '@app/utils/language';

export class ModFile {
  @IsString()
  name: string;

  @IsNumber()
  size: number;

  @IsString()
  url: string;

  @IsString()
  type: string;
}

export class ContributeModDto {
  @IsString()
  @IsOptional()
  readonly title: string;

  @IsString()
  @IsOptional()
  readonly originTitle: string;

  @IsString()
  @IsOptional()
  readonly alias: string;

  @IsString()
  @IsOptional()
  readonly description: string;

  @IsArray()
  @IsOptional()
  readonly playerNumber: [number, number];

  @IsString()
  @IsOptional()
  readonly moduleRule: string;

  @IsArray()
  @IsOptional()
  readonly tags: Array<string>;

  @IsOptional()
  @IsEnum(LanguageCodes, { each: true })
  readonly languages: Array<LanguageCodes>;

  @IsString()
  @IsNotEmpty({
    message: '请填写模组作者'
  })
  @IsOptional()
  readonly author: string;

  @ValidateIf((o: CreateModDto) => o.originUrl !== '')
  @IsUrl(
    { require_protocol: true },
    { message: '请填写可访问的链接' },
  )
  // @IsNotEmpty({
  //   message: '请填写模组发布地址'
  // })
  @IsOptional()
  readonly originUrl: string;

  @IsString()
  @IsOptional()
  readonly coverUrl: string;

  @IsArray()
  @IsOptional()
  readonly imageUrls: string[];

  @IsString()
  @IsOptional()
  readonly releaseDate: string;
}

export class UpdateModDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly title: string;

  @IsString()
  @IsOptional()
  readonly alias: string;

  @IsString()
  @IsOptional()
  readonly description: string;

  @IsString()
  @IsOptional()
  readonly coverUrl: string;

  @IsArray()
  @IsOptional()
  readonly imageUrls: string[];

  @IsArray()
  @IsOptional()
  readonly playerNumber: [number, number];

  @IsOptional()
  @IsEnum(LanguageCodes, { each: true })
  readonly languages: Array<LanguageCodes>;

  @IsString()
  @IsOptional()
  readonly moduleRule: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModFile)
  @IsOptional()
  readonly modFiles: Array<ModFile>

  @IsArray()
  @IsOptional()
  readonly tags: Array<string>;
}


export class CreateModDto {
  // 是否为站外模组
  @IsBoolean()
  readonly isForeign: boolean;

  @IsString()
  @IsNotEmpty({
    message: '请填写模组标题'
  })
  readonly title: string;

  @IsString()
  @IsOptional()
  readonly originTitle: string;

  @IsString()
  @IsOptional()
  readonly alias: string;

  @IsString()
  @IsOptional()
  readonly description: string;

  @IsString()
  @IsOptional()
  readonly coverUrl: string;

  @IsArray()
  @IsOptional()
  readonly imageUrls: string[];

  @IsArray()
  readonly playerNumber: [number, number];

  @IsString()
  readonly moduleRule: string;

  @IsArray()
  @IsOptional()
  readonly tags: Array<string>;

  @IsOptional()
  @IsEnum(LanguageCodes, { each: true })
  readonly languages: Array<LanguageCodes>;

  @ValidateIf((o: CreateModDto) => !o.isForeign)
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: '最少上传1个模组文件' })
  @Type(() => ModFile)
  readonly modFiles: Array<ModFile>;

  @ValidateIf((o: CreateModDto) => o.isForeign)
  @IsString()
  @IsNotEmpty({
    message: '请填写模组作者'
  })
  readonly author: string;

  @ValidateIf((o: CreateModDto) => o.isForeign && o.originUrl !== '')
  @IsUrl(
    { require_protocol: true },
    { message: '请填写可访问的链接' },
  )
  // @IsNotEmpty({
  //   message: '请填写模组发布地址'
  // })
  @IsOptional()
  readonly originUrl: string;

  @IsString()
  @IsOptional()
  readonly releaseDate: string;
}
