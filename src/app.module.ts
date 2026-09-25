import { Module } from '@nestjs/common';
import { FeatureModule } from './feature/feature.module';
import { ConfigModule } from '@nestjs/config';
import config, { configValidationSchema } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      cache: true,
      validationSchema: configValidationSchema,
    }),
    FeatureModule,
  ],
})
export class AppModule {}
