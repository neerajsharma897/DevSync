import { db } from './src/config/db.js';
import { users } from './src/db/schema/index.js';
async function main() {
  const allUsers = await db.select().from(users);
  console.log("Users in DB:", allUsers.map(u => u.fullName));
  process.exit(0);
}
main().catch(console.error);
