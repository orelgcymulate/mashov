import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BehaviorDocument = HydratedDocument<Behavior>;

@Schema({ collection: 'behaviorEvents', timestamps: true })
export class Behavior {
  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true, index: true })
  kidId!: Types.ObjectId;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  eventType!: string;

  @Prop({ default: '' })
  note!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ default: true })
  justified!: boolean;

  @Prop()
  teacherName?: string;
}

export const BehaviorSchemaDef = SchemaFactory.createForClass(Behavior);
BehaviorSchemaDef.index({ kidId: 1, date: -1 });
