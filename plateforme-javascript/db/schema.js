import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', { id: text('id').primaryKey(), kind: text('kind').notNull(), owner: text('owner').notNull(), data: text('data').notNull() });
export const settings = sqliteTable('settings', { id: text('id').primaryKey(), value: text('value').notNull() });
