import * as SQLite from 'expo-sqlite';

import {
  Activity,
  ActivityCategory,
  ActivityHistoryEntry,
  ActivityStatus,
} from '@/data/mockActivities';

const DB_NAME = 'insightlog.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

/**
 * Cria as tabelas (idempotente). Modelo relacional:
 * uma atividade tem muitas entradas de histórico (1:N), com remoção em cascata.
 */
export async function initActivityDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      activityTime TEXT,
      status TEXT NOT NULL,
      reminderEnabled INTEGER NOT NULL DEFAULT 0,
      reminderOffsetMinutes INTEGER,
      notificationId TEXT,
      photoUri TEXT,
      latitude REAL,
      longitude REAL,
      locationLabel TEXT,
      rating INTEGER,
      userId TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_history (
      id TEXT PRIMARY KEY NOT NULL,
      activityId TEXT NOT NULL,
      status TEXT NOT NULL,
      changedAt TEXT NOT NULL,
      note TEXT,
      postponedUntil TEXT,
      FOREIGN KEY (activityId) REFERENCES activities (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_history_activity ON activity_history (activityId);
  `);

  // Migração: garante as colunas de localização em bancos criados antes do TP3.
  await ensureColumn(db, 'activities', 'latitude', 'REAL');
  await ensureColumn(db, 'activities', 'longitude', 'REAL');
  await ensureColumn(db, 'activities', 'locationLabel', 'TEXT');
  // Migração: avaliação por estrelas (TP3 personalização).
  await ensureColumn(db, 'activities', 'rating', 'INTEGER');
  // Migração: vínculo com o usuário dono da atividade (isolamento de dados).
  await ensureColumn(db, 'activities', 'userId', 'TEXT');
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  type: string
) {
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`
  );
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

type ActivityRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  createdAt: string;
  activityTime: string | null;
  status: string;
  reminderEnabled: number;
  reminderOffsetMinutes: number | null;
  notificationId: string | null;
  photoUri: string | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  rating: number | null;
};

type HistoryRow = {
  id: string;
  activityId: string;
  status: string;
  changedAt: string;
  note: string | null;
  postponedUntil: string | null;
};

/** Lê as atividades do usuário, já com seu histórico montado. */
export async function getAllActivities(userId: string): Promise<Activity[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<ActivityRow>(
    'SELECT * FROM activities WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  );
  const historyRows = await db.getAllAsync<HistoryRow>(
    `SELECT h.* FROM activity_history h
       JOIN activities a ON a.id = h.activityId
      WHERE a.userId = ?
      ORDER BY h.changedAt ASC`,
    [userId]
  );

  const historyByActivity = new Map<string, ActivityHistoryEntry[]>();
  for (const h of historyRows) {
    const list = historyByActivity.get(h.activityId) ?? [];
    list.push({
      id: h.id,
      status: h.status as ActivityStatus,
      changedAt: h.changedAt,
      note: h.note ?? undefined,
      postponedUntil: h.postponedUntil ?? undefined,
    });
    historyByActivity.set(h.activityId, list);
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    category: r.category as ActivityCategory,
    createdAt: r.createdAt,
    activityTime: r.activityTime ?? undefined,
    status: r.status as ActivityStatus,
    reminderEnabled: r.reminderEnabled === 1,
    reminderOffsetMinutes: r.reminderOffsetMinutes ?? undefined,
    notificationId: r.notificationId ?? undefined,
    photoUri: r.photoUri ?? undefined,
    latitude: r.latitude ?? undefined,
    longitude: r.longitude ?? undefined,
    locationLabel: r.locationLabel ?? undefined,
    rating: r.rating ?? undefined,
    history: historyByActivity.get(r.id) ?? [],
  }));
}

/** Insere ou atualiza uma atividade e regrava seu histórico, de forma atômica. */
export async function upsertActivity(
  activity: Activity,
  userId: string
): Promise<void> {
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO activities
         (id, title, description, category, createdAt, activityTime, status,
          reminderEnabled, reminderOffsetMinutes, notificationId, photoUri,
          latitude, longitude, locationLabel, rating, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.id,
        activity.title,
        activity.description ?? null,
        activity.category,
        activity.createdAt,
        activity.activityTime ?? null,
        activity.status,
        activity.reminderEnabled ? 1 : 0,
        activity.reminderOffsetMinutes ?? null,
        activity.notificationId ?? null,
        activity.photoUri ?? null,
        activity.latitude ?? null,
        activity.longitude ?? null,
        activity.locationLabel ?? null,
        activity.rating ?? null,
        userId,
      ]
    );

    await db.runAsync('DELETE FROM activity_history WHERE activityId = ?', [
      activity.id,
    ]);

    for (const h of activity.history) {
      await db.runAsync(
        `INSERT INTO activity_history
           (id, activityId, status, changedAt, note, postponedUntil)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          h.id,
          activity.id,
          h.status,
          h.changedAt,
          h.note ?? null,
          h.postponedUntil ?? null,
        ]
      );
    }
  });
}

/** Remove a atividade e seu histórico. */
export async function deleteActivity(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM activity_history WHERE activityId = ?', [id]);
  await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
}
