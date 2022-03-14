import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IRefreshTokenDto } from '@app/interfaces/shared/api';

export class RefreshTokenDto implements IRefreshTokenDto {

    @ApiProperty({
      example: 'pejman@gmail.com',
      description: 'refreshToken',
    })
    @IsNotEmpty()
    @IsString()
    readonly refreshToken: string;
  }
