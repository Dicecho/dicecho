import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsString,
  IsUrl,
  IsMongoId,
} from 'class-validator';

export class PendantSendDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId({ message: 'userId错误' },)
  readonly userId: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId({ message: 'pendantId错误' },)
  readonly pendantId: string;
}
