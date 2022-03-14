import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { APPExceptionFilter, BadRequestException } from '@app/core';
import { flattenValidationErrors } from '@app/utils/exception';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) => { 
      throw new BadRequestException(flattenValidationErrors(errors)[0])
    },
  }));
  // app.useGlobalFilters(new APPExceptionFilter());
  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('API')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('doc', app, document);
  await app.listen(configService.get<number>('PORT'));
}
bootstrap();
