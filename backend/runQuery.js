import { db } from './src/config/database.js';

async function run() {
  try {
    await db.raw('ALTER TABLE leads ADD COLUMN is_active BOOLEAN DEFAULT true AFTER status');
    console.log('Added is_active');
  } catch(e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
run();
