import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleSlot, ScheduleSlotSchemaDef } from './schedule.schema';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ScheduleSlot.name, schema: ScheduleSlotSchemaDef }])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService, MongooseModule],
})
export class ScheduleModule {}
