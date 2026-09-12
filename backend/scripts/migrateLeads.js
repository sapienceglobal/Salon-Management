import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'salon360'
  });

  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM leads");
    const colNames = cols.map(c => c.Field);
    console.log("Current columns:", colNames);

    if (!colNames.includes('gender')) {
      await connection.query("ALTER TABLE leads ADD COLUMN gender ENUM('Male', 'Female', 'Other')");
      console.log("Added gender");
    }
    if (!colNames.includes('location')) {
      await connection.query("ALTER TABLE leads ADD COLUMN location VARCHAR(255)");
      console.log("Added location");
    }
    if (!colNames.includes('assigned_to')) {
      await connection.query("ALTER TABLE leads ADD COLUMN assigned_to INT");
      await connection.query("ALTER TABLE leads ADD CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL");
      console.log("Added assigned_to");
    }
    console.log("Success");
  } catch (err) {
    console.error(err);
  } finally {
    connection.end();
  }
}
run();
