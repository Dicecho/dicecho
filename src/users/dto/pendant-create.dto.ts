import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsString,
  IsUrl,
} from 'class-validator';

export class PendantCreateDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(24)
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl(
    { require_protocol: true },
    { message: '请填写可访问的链接' },
  )
  readonly url: string;
}
