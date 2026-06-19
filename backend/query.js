import { db } from './src/config/db.js';
import { tasks } from './src/db/schema/tasks.js';
import { sql } from 'drizzle-orm';

async function run() {
  const t = await db.select({ tsv: sql`description_tsv` }).from(tasks).limit(1);
  console.log(t);
  process.exit(0);
}
run();
