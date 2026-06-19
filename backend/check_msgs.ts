import { db } from './src/config/db.js';
import { messages } from './src/db/schema/index.js';
import { desc } from 'drizzle-orm';

async function main() {
  const msgs = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(5);
  console.log("Recent messages:");
  for (const m of msgs) {
    console.log(`[${m.createdAt}] Author: ${m.authorId} Body: ${m.bodyText}`);
  }
  process.exit(0);
}
main().catch(console.error);
