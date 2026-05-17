import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HomeworkDocument = HydratedDocument<Homework>;

@Schema({ collection: 'homework', timestamps: true })
export class Homework {
  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true, index: true })
  kidId!: Types.ObjectId;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  homework!: string;

  @Prop({ required: true })
  lessonDate!: Date;

  @Prop()
  dueDate?: Date;

  @Prop()
  teacherName?: string;

  @Prop({ default: false })
  done!: boolean;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;
}

export const HomeworkSchemaDef = SchemaFactory.createForClass(Homework);
HomeworkSchemaDef.index({ kidId: 1, lessonDate: -1 });
HomeworkSchemaDef.index({ kidId: 1, done: 1, lessonDate: -1 });
