import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleSlotDocument = HydratedDocument<ScheduleSlot>;

@Schema({ collection: 'scheduleSlots', timestamps: true })
export class ScheduleSlot {
  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true, index: true })
  kidId!: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 7 })
  day!: number;

  @Prop({ required: true, min: 1, max: 8 })
  lesson!: number;

  @Prop({ required: true })
  subject!: string;

  @Prop()
  roomNum?: string;

  @Prop()
  teacher?: string;
}

export const ScheduleSlotSchemaDef = SchemaFactory.createForClass(ScheduleSlot);
ScheduleSlotSchemaDef.index({ kidId: 1, day: 1, lesson: 1 }, { unique: true });
