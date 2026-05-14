import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationCreate, NotificationUpdate } from '@mashov/shared';
import { Notification, NotificationDocument } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private readonly model: Model<NotificationDocument>) {}

  list(kidId?: string): Promise<NotificationDocument[]> {
    const filter: Record<string, unknown> = {};
    if (kidId) filter.kidId = new Types.ObjectId(kidId);
    return this.model.find(filter).sort({ date: -1 }).exec();
  }

  async getById(id: string): Promise<NotificationDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('notification_not_found');
    return doc;
  }

  create(input: NotificationCreate): Promise<NotificationDocument> {
    return this.model.create(input);
  }

  async update(id: string, patch: NotificationUpdate): Promise<NotificationDocument> {
    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    if (!doc) throw new NotFoundException('notification_not_found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('notification_not_found');
  }
}
