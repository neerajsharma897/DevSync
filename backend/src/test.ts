import { db } from './config/db.js';
import { workspaces } from './db/schema/workspaces.js';
import { eq } from 'drizzle-orm';
async function test() {
  try {
    const slug = 'test-slug';
    const [ws] = await db.select({ workspaceId: workspaces.workspaceId }).from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    console.log('WS:', ws);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
test();
