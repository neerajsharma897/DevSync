import { db } from './src/config/db.js';
import { tasks } from './src/db/schema/tasks.js';
import { eq, and, isNull } from 'drizzle-orm';

async function run() {
  try {
    const [task] = await db.select().from(tasks).limit(1);
    console.log("Selected task ID:", task.taskId);
    
    const [deleted] = await db
      .update(tasks)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(tasks.taskId, task.taskId), isNull(tasks.deletedAt)))
      .returning({ taskId: tasks.taskId });
      
    console.log("Deleted:", deleted);
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    process.exit(0);
  }
}
run();
