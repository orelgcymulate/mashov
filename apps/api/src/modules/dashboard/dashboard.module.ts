import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { KidsModule } from '../kids/kids.module';
import { HomeworkModule } from '../homework/homework.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { GradesModule } from '../grades/grades.module';
import { BehaviorModule } from '../behavior/behavior.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [KidsModule, HomeworkModule, ScheduleModule, GradesModule, BehaviorModule, MessagesModule, NotificationsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
