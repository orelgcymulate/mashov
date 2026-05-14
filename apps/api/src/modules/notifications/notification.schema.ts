import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true, index: true })
  kidId!: Types.ObjectId;

  @Prop({ required: true })
  text!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ default: true })
  isNew!: boolean;
}

export const NotificationSchemaDef = SchemaFactory.createForClass(Notification);
NotificationSchemaDef.index({ kidId: 1, date: -1 });
