import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { SlidingSessionInterceptor } from './modules/auth/sliding-session.interceptor';
import { KidsModule } from './modules/kids/kids.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { GradesModule } from './modules/grades/grades.module';
import { BehaviorModule } from './modules/behavior/behavior.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CallsModule } from './modules/calls/calls.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URL') ?? 'mongodb://localhost:27017/mashov',
      }),
    }),
    AuthModule,
    KidsModule,
    HomeworkModule,
    ScheduleModule,
    GradesModule,
    BehaviorModule,
    MessagesModule,
    NotificationsModule,
    DashboardModule,
    CallsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: SlidingSessionInterceptor },
  ],
})
export class AppModule {}
