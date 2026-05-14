import { Controller, Get, Query } from '@nestjs/common';
import { HomeworkService } from '../homework/homework.service';
import { ScheduleService } from '../schedule/schedule.service';
import { GradesService } from '../grades/grades.service';
import { BehaviorService } from '../behavior/behavior.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { KidsService } from '../kids/kids.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly kids: KidsService,
    private readonly homework: HomeworkService,
    private readonly schedule: ScheduleService,
    private readonly grades: GradesService,
    private readonly behavior: BehaviorService,
    private readonly messages: MessagesService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('summary')
  async summary(@Query('kidId') kidIdParam?: string | string[]) {
    const requested = await this.resolveKidIds(kidIdParam);
    const entries = await Promise.all(
      requested.map(async (kidId) => {
        const [homework, schedule, grades, behavior, messages, notifications] = await Promise.all([
          this.homework.list({ kidId }),
          this.schedule.list(kidId),
          this.grades.list(kidId),
          this.behavior.list(kidId),
          this.messages.list(kidId),
          this.notifications.list(kidId),
        ]);
        return [kidId, { homework, schedule, grades, behavior, messages, notifications }] as const;
      }),
    );
    return {
      fetchedAt: new Date().toISOString(),
      kids: Object.fromEntries(entries),
    };
  }

  private async resolveKidIds(param?: string | string[]): Promise<string[]> {
    if (param) return Array.isArray(param) ? param : [param];
    const all = await this.kids.list();
    return all.map((k) => k._id.toString());
  }
}
