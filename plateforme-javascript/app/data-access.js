import { env } from 'cloudflare:workers';
import { getChatGPTUser } from './chatgpt-auth';
export async function getContext() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const db = env.DB;
  await db.prepare('INSERT OR IGNORE INTO settings (id,value) VALUES (?,?)').bind('admin', user.userId).run();
  const row = await db.prepare('SELECT value FROM settings WHERE id=?').bind('admin').first();
  return {user, db, admin: row.value === user.userId, webSearchKey: row.value === user.userId ? env.BRAVE_SEARCH_API_KEY : null};
}
export async function readRecords(db) {
  const rows = await db.prepare('SELECT * FROM records').all();
  return rows.results.map(row => ({...JSON.parse(row.data), id:row.id, kind:row.kind, owner:row.owner}));
}
