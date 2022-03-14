import { IRateListQuery, RateSortKey, SortOrder, IRateFilter } from '@app/interfaces/shared/api';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsEnum, Min, Max, IsBooleanString, ValidateNested } from 'class-validator';
import { NotificationType } from '../constants';
export * from '@app/interfaces/shared/api/rate';

export class NotificationFilter {
  @IsEnum(NotificationType)
  @IsOptional()
  type: NotificationType;

  @IsBooleanString()
  // @Type(() => Boolean)
  @IsOptional()
  isUnread: boolean;
}

export class NotificationListQuery {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  readonly pageSize: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  readonly sort: Record<RateSortKey, SortOrder>;

  @ValidateNested()
  @Type(() => NotificationFilter)
  @IsOptional()
  readonly filter: Partial<NotificationFilter>;
}
