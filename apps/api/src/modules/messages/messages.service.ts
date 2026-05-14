import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessageCreate, MessageUpdate } from '@mashov/shared';
import { Message, MessageDocument } from './message.schema';

@Injectable()
export class MessagesService {
  constructor(@InjectModel(Message.name) private readonly model: Model<MessageDocument>) {}

  list(kidId?: string): Promise<MessageDocument[]> {
    const filter: Record<string, unknown> = {};
    if (kidId) filter.kidId = new Types.ObjectId(kidId);
    return this.model.find(filter).sort({ sentAt: -1 }).exec();
  }

  async getById(id: string): Promise<MessageDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('message_not_found');
    return doc;
  }

  create(input: MessageCreate): Promise<MessageDocument> {
    return this.model.create(input);
  }

  async update(id: string, patch: MessageUpdate): Promise<MessageDocument> {
    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    if (!doc) throw new NotFoundException('message_not_found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('message_not_found');
  }
}
