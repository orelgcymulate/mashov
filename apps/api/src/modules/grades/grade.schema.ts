import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GradeDocument = HydratedDocument<Grade>;

@Schema({ collection: 'grades', timestamps: true })
export class Grade {
  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true, index: true })
  kidId!: Types.ObjectId;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  event!: string;

  @Prop({ required: true, min: 0, max: 100 })
  grade!: number;

  @Prop({ default: 'מבחן' })
  gradeType!: string;

  @Prop({ required: true })
  eventDate!: Date;

  @Prop()
  teacherName?: string;
}

export const GradeSchemaDef = SchemaFactory.createForClass(Grade);
GradeSchemaDef.index({ kidId: 1, eventDate: -1 });
