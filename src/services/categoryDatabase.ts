import * as SQLite from 'expo-sqlite';

import { Category, defaultCategoriesFor } from '@/data/categories';

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

export async function initCategoryDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      isDefault INTEGER NOT NULL DEFAULT 0,
      userId TEXT
    );
  `);
  // Migração: vincula categorias ao usuário em bancos criados antes do escopo.
  await ensureColumn(db, 'categories', 'userId', 'TEXT');
}

/** Garante que o usuário tenha as 3 categorias padrão (idempotente). */
export async function seedDefaultCategories(userId: string) {
  const db = await getDb();
  for (const c of defaultCategoriesFor(userId)) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, color, icon, isDefault, userId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.color, c.icon, c.isDefault ? 1 : 0, userId]
    );
  }
}

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: number;
};

export async function getAllCategories(userId: string): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories WHERE userId = ? ORDER BY isDefault DESC, name ASC',
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon,
    isDefault: r.isDefault === 1,
  }));
}

export async function upsertCategory(category: Category, userId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO categories (id, name, color, icon, isDefault, userId)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      category.id,
      category.name.trim(),
      category.color,
      category.icon,
      category.isDefault ? 1 : 0,
      userId,
    ]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

/** Conta as atividades do usuário que usam a categoria — antes de excluir. */
export async function countActivitiesInCategory(
  categoryId: string,
  userId: string
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) as total FROM activities WHERE category = ? AND userId = ?',
    [categoryId, userId]
  );
  return row?.total ?? 0;
}
