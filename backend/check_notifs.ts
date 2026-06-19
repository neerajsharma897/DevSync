import { db } from './src/config/db.js';
import { notifications } from './src/db/schema/index.js';
import { desc } from 'drizzle-orm';

async function main() {
  const notifs = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(10);
  console.log("Recent notifications:");
  console.log(notifs);
  process.exit(0);
}
main().catch(console.error);
