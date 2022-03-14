import { IsNotEmpty, IsString } from 'class-validator';

export class AppealDto {
  @IsNotEmpty()
  @IsString()
  readonly targetName: string;

  @IsNotEmpty()
  @IsString()
  readonly targetId: string;

  @IsNotEmpty()
  @IsString()
  readonly reason: string;
}
