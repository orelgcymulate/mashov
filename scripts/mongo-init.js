// Runs once, the first time the Mongo container starts (before any data exists).
// Mounted into /docker-entrypoint-initdb.d/ by docker-compose.yml.
//
// Creates the application database and the indexes the API relies on for
// fast filtered reads. Idempotent — safe to re-run.

const dbName = process.env.MONGO_INITDB_DATABASE || 'mashov';
const target = db.getSiblingDB(dbName);

const indexes = {
  kids: [{ key: { slug: 1 }, unique: true }],
  homework: [
    { key: { kidId: 1, lessonDate: 1 } },
    { key: { kidId: 1, done: 1 } },
  ],
  scheduleSlots: [
    { key: { kidId: 1, day: 1, lesson: 1 }, unique: true },
  ],
  grades: [{ key: { kidId: 1, eventDate: -1 } }],
  behaviorEvents: [{ key: { kidId: 1, date: -1 } }],
  messages: [
    { key: { kidId: 1, sentAt: -1 } },
    { key: { kidId: 1, isNew: 1 } },
  ],
  notifications: [{ key: { kidId: 1, date: -1 } }],
};

for (const [collection, defs] of Object.entries(indexes)) {
  target.createCollection(collection);
  for (const def of defs) {
    target[collection].createIndex(def.key, { unique: !!def.unique });
  }
  print(`[mongo-init] ${dbName}.${collection}: ${defs.length} index(es) ensured`);
}

print('[mongo-init] done.');
