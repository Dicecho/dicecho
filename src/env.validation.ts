import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsNotEmpty, IsString, validateSync, IsOptional, IsBoolean, IsBooleanString } from 'class-validator';

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
  Dev = "dev",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsOptional()
  @IsBooleanString()
  ES_ENABLED: string;

  @IsOptional()
  @IsString()
  ES_URL: string;

  @IsNotEmpty()
  @IsString()
  ES_USERNAME: string;

  @IsNotEmpty()
  @IsString()
  ES_PASSWORD: string;

  @IsNotEmpty()
  @IsString()
  MONGO_URI: string;

  @IsNotEmpty()
  @IsString()
  MONGODB_DATABASE: string;

  @IsNotEmpty()
  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsNotEmpty()
  @IsString()
  JWT_EXPIRESIN: string;

  @IsNotEmpty()
  @IsString()
  WEBSITE: string;

  @IsNotEmpty()
  @IsString()
  PROTOCOL: string;

  @IsNotEmpty()
  @IsString()
  MAIL_DOMAIN: string;

  @IsNotEmpty()
  @IsString()
  MAIL_API_KEY: string;

  @IsNotEmpty()
  @IsString()
  MAIL_HOST: string;

  @IsNotEmpty()
  @IsString()
  SENTRY_DSN: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}