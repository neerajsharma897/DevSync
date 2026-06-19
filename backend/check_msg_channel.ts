import { db } from './src/config/db.js';
import { messages, channelMembers } from './src/db/schema/index.js';
import { desc, eq, and } from 'drizzle-orm';

async function main() {
  const [msg] = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(1);
  console.log("Channel ID of latest message:", msg.channelId);
  
  const members = await db.select().from(channelMembers).where(eq(channelMembers.channelId, msg.channelId!));
  console.log("Members of this channel:", members.map(m => m.userId));
  
  process.exit(0);
}
main().catch(console.error);
