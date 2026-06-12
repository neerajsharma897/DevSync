import { db } from '../src/config/db.js';
import { users } from '../src/db/schema/auth.js';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const rawUsers = [
  { email: 'alice@demo.com', fullName: 'Alice Carter' },
  { email: 'bob@demo.com', fullName: 'Bob Sharma' },
  { email: 'carol@demo.com', fullName: 'Carol Nguyen' },
  { email: 'dave@demo.com', fullName: 'Dave Patel' },
  { email: 'eve@demo.com', fullName: 'Eve Robinson' },
  { email: 'frank@demo.com', fullName: 'Frank Liu' },
  { email: 'grace@demo.com', fullName: 'Grace Kim' },
  { email: 'hank@demo.com', fullName: 'Hank Torres' },
  { email: 'iris@demo.com', fullName: 'Iris Mehta' },
  { email: 'jack@demo.com', fullName: 'Jack Williams' },
  { email: 'karen@demo.com', fullName: 'Karen Singh' },
  { email: 'leo@demo.com', fullName: 'Leo Costa' },
  { email: 'mia@demo.com', fullName: 'Mia Johnson' },
  { email: 'nate@demo.com', fullName: 'Nate Brown' },
  { email: 'olivia@demo.com', fullName: 'Olivia Chen' },
  { email: 'pete@demo.com', fullName: 'Pete Iyer' },
  { email: 'quinn@demo.com', fullName: 'Quinn Adams' },
  { email: 'rachel@demo.com', fullName: 'Rachel Ford' },
  { email: 'sam@demo.com', fullName: 'Sam Kapoor' },
  { email: 'tina@demo.com', fullName: 'Tina Reyes' }
];

async function seedUsers() {
  console.log('Seeding 20 users...');
  const saltRounds = 10;
  const commonPassword = 'password123';
  const hashedPassword = await bcrypt.hash(commonPassword, saltRounds);

  const results = [];

  for (const user of rawUsers) {
    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, user.email)
    });

    if (!existing) {
      // Generate a realistic avatar using Faker
      const avatarUrl = faker.image.avatar();

      await db.insert(users).values({
        email: user.email,
        fullName: user.fullName,
        passwordHash: hashedPassword,
        avatarUrl: avatarUrl
      });
      console.log(`Created: ${user.fullName} (${user.email})`);
    } else {
      console.log(`Skipped (already exists): ${user.fullName} (${user.email})`);
    }

    results.push({
      Name: user.fullName,
      Email: user.email,
      Password: commonPassword
    });
  }

  console.log('\n--- SEED COMPLETE ---');
  console.table(results);
  process.exit(0);
}

seedUsers().catch(console.error);
