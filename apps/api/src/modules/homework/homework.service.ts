import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HomeworkCreate, HomeworkUpdate } from '@mashov/shared';
import { Homework, HomeworkDocument } from './homework.schema';

interface ListQuery {
  kidId?: string;
  done?: boolean;
}

@Injectable()
export class HomeworkService {
  constructor(@InjectModel(Homework.name) private readonly model: Model<HomeworkDocument>) {}

  list(query: ListQuery = {}): Promise<HomeworkDocument[]> {
    const filter: Record<string, unknown> = {};
    if (query.kidId) filter.kidId = new Types.ObjectId(query.kidId);
    if (typeof query.done === 'boolean') filter.done = query.done;
    return this.model.find(filter).sort({ lessonDate: -1 }).exec();
  }

  async getById(id: string): Promise<HomeworkDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('homework_not_found');
    return doc;
  }

  create(input: HomeworkCreate): Promise<HomeworkDocument> {
    return this.model.create({
      ...input,
      done: input.done ?? false,
      completedAt: input.done ? new Date() : null,
    });
  }

  async update(id: string, patch: HomeworkUpdate): Promise<HomeworkDocument> {
    const current = await this.getById(id);
    const update: Record<string, unknown> = { ...patch };
    if (typeof patch.done === 'boolean' && patch.done !== current.done) {
      update.completedAt = patch.done ? new Date() : null;
    }
    const doc = await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!doc) throw new NotFoundException('homework_not_found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('homework_not_found');
  }
}
