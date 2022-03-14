import {
  IsUrl,
  IsNotEmpty,
} from 'class-validator';

export class UploadFromUrlDto {
  @IsNotEmpty()
  @IsUrl()
  readonly url: string;
}
