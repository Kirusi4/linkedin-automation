import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Post as PostEntity } from './post/post.entity';
import { LinkedInService } from './linkedin/linkedin.service';
import { AutomationService } from './automation/automation.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [PostEntity],
        synchronize: true, // Only for development
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([PostEntity]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, LinkedInService, AutomationService],
})
export class AppModule { }
