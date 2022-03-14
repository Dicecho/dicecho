import { IsNumber, IsOptional, Min, Max, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { IBasicSearchQuery } from '../search.interface';


export class SearchQuery implements IBasicSearchQuery {
  @IsString()
  // @IsNotEmpty({ message: '请输入搜索关键词' })
  readonly keyword: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  readonly pageSize: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly page: number = 1;
}
