import { initDb, query, run, closeDb } from '../src/db/index.js';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

async function main() {
  await initDb();

  // 1. Ensure Ada is a normal user (role: 'user')
  await run("UPDATE users SET role = 'user' WHERE email = 'ada@example.com'");

  // 2. Ensure Admin exists (role: 'admin')
  const existingAdmin = await query("SELECT id FROM users WHERE email = 'admin@linkpulse.dev'");
  if (!existingAdmin.length) {
    const adminId = nanoid();
    const hash = await bcrypt.hash('admin1234', 10);
    await run(
      "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [adminId, 'Admin', 'admin@linkpulse.dev', hash, 'admin', new Date().toISOString()]
    );
  }

  // 3. Ensure Grace exists (role: 'user') as an extra normal user
  const existingGrace = await query("SELECT id FROM users WHERE email = 'grace@example.com'");
  if (!existingGrace.length) {
    const graceId = nanoid();
    const hash = await bcrypt.hash('password123', 10);
    await run(
      "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [graceId, 'Grace Hopper', 'grace@example.com', hash, 'user', new Date().toISOString()]
    );
  }

  const users = await query("SELECT id, name, email, role FROM users");
  console.log('Setup complete! Current users in database:');
  console.table(users);
  await closeDb();
}

main().catch((err) => {
  console.error('Setup users error:', err);
  process.exit(1);
});
