import * as SQLite from 'expo-sqlite';

export type GoalPeriod = 'week' | 'month';

export type Goal = {
  id: string;
  categoryId: string;
  period: GoalPeriod;
  target: number;
};

const DB_NAME = 'insightlog.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
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

export async function initGoalDatabase() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      categoryId TEXT NOT NULL,
      period TEXT NOT NULL,
      target INTEGER NOT NULL,
      userId TEXT
    );
  `);
  // Migração: vincula metas ao usuário em bancos criados antes do escopo.
  await ensureColumn(db, 'goals', 'userId', 'TEXT');
}

type GoalRow = {
  id: string;
  categoryId: string;
  period: string;
  target: number;
};

export async function getAllGoals(userId: string): Promise<Goal[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<GoalRow>(
    'SELECT * FROM goals WHERE userId = ?',
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    categoryId: r.categoryId,
    period: r.period === 'month' ? 'month' : 'week',
    target: r.target,
  }));
}

export async function upsertGoal(goal: Goal, userId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO goals (id, categoryId, period, target, userId)
     VALUES (?, ?, ?, ?, ?)`,
    [goal.id, goal.categoryId, goal.period, goal.target, userId]
  );
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
}
