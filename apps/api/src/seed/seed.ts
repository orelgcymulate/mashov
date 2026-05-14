import 'dotenv/config';
import mongoose from 'mongoose';
import { PROFILES, KidProfile, MashovDay } from './data';

const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://localhost:27017/mashov';

function offsetDate(days: number, hour = 8, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seed(): Promise<void> {
  console.log(`[seed] connecting to ${MONGO_URL}`);
  await mongoose.connect(MONGO_URL);
  const db = mongoose.connection.db!;

  const collections = ['kids', 'homework', 'scheduleSlots', 'grades', 'behaviorEvents', 'messages', 'notifications'];
  for (const name of collections) {
    await db.collection(name).deleteMany({});
  }
  console.log('[seed] cleared collections');

  for (const profile of PROFILES) {
    const kidRes = await db.collection('kids').insertOne({
      slug: profile.slug,
      name: profile.name,
      color: profile.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const kidId = kidRes.insertedId;

    await seedKid(db, kidId, profile);
    console.log(`[seed] ${profile.slug} populated`);
  }

  await mongoose.disconnect();
  console.log('[seed] done.');
}

async function seedKid(db: import('mongodb').Db, kidId: import('mongodb').ObjectId, p: KidProfile): Promise<void> {
  const now = new Date();

  await db.collection('homework').insertMany(
    p.homework.map((h) => {
      const lessonDate = offsetDate(h.lessonOffset);
      const done = h.lessonOffset < 0;
      return {
        kidId,
        subject: h.subject,
        homework: h.homework,
        lessonDate,
        dueDate: lessonDate,
        teacherName: p.teachers[h.subject] ?? '',
        done,
        completedAt: done ? new Date(lessonDate.getTime() + 18 * 60 * 60 * 1000) : null,
        createdAt: now,
        updatedAt: now,
      };
    }),
  );

  const slots: Record<string, unknown>[] = [];
  for (const dayStr of Object.keys(p.schedule)) {
    const day = Number(dayStr) as MashovDay;
    for (const slot of p.schedule[day]) {
      slots.push({
        kidId,
        day,
        lesson: slot.lesson,
        subject: slot.subject,
        roomNum: slot.room,
        teacher: p.teachers[slot.subject] ?? '',
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  if (slots.length > 0) await db.collection('scheduleSlots').insertMany(slots);

  await db.collection('grades').insertMany(
    p.grades.map((g) => ({
      kidId,
      subject: g.subject,
      event: g.event,
      grade: g.grade,
      gradeType: 'מבחן',
      eventDate: offsetDate(-g.daysAgo, 10),
      teacherName: p.teachers[g.subject] ?? '',
      createdAt: now,
      updatedAt: now,
    })),
  );

  await db.collection('behaviorEvents').insertMany(
    p.behavior.map((b) => ({
      kidId,
      subject: b.subject,
      eventType: b.eventType,
      note: b.note,
      date: offsetDate(-b.daysAgo, 9),
      justified: b.justified,
      teacherName: p.teachers[b.subject] ?? '',
      createdAt: now,
      updatedAt: now,
    })),
  );

  await db.collection('messages').insertMany(
    p.messages.map((m) => ({
      kidId,
      subject: m.subject,
      sender: m.sender,
      body: m.body ?? '',
      sentAt: offsetDate(-m.daysAgo, 14),
      isNew: m.isNew,
      createdAt: now,
      updatedAt: now,
    })),
  );

  await db.collection('notifications').insertMany(
    p.notifications.map((n) => ({
      kidId,
      text: n.text,
      date: offsetDate(-n.daysAgo, 12),
      isNew: n.daysAgo <= 1,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

seed().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
