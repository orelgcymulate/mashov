import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ collection: 'messages', timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Kid', required: true, index: true })
  kidId!: Types.ObjectId;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  sender!: string;

  @Prop()
  body?: string;

  @Prop({ required: true })
  sentAt!: Date;

  @Prop({ default: true })
  isNew!: boolean;
}

export const MessageSchemaDef = SchemaFactory.createForClass(Message);
MessageSchemaDef.index({ kidId: 1, sentAt: -1 });
