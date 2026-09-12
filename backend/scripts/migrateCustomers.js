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
    const [cols] = await connection.query("SHOW COLUMNS FROM customers");
    const colNames = cols.map(c => c.Field);
    console.log("Current customers columns:", colNames);

    const neededColumns = {
      gender: "ENUM('male', 'female', 'other')",
      date_of_birth: "DATE",
      anniversary: "DATE",
      address: "TEXT",
      gst_number: "VARCHAR(20)",
      sms_opt_in: "BOOLEAN DEFAULT TRUE",
      email_opt_in: "BOOLEAN DEFAULT TRUE",
      whatsapp_opt_in: "BOOLEAN DEFAULT TRUE",
      source: "VARCHAR(50)",
      notes: "TEXT",
      total_spent: "DECIMAL(10,2) DEFAULT 0",
      total_visits: "INT DEFAULT 0",
      last_visit_at: "TIMESTAMP NULL",
      wallet_balance: "DECIMAL(10,2) DEFAULT 0"
    };

    for (const [col, def] of Object.entries(neededColumns)) {
      if (!colNames.includes(col)) {
        await connection.query(`ALTER TABLE customers ADD COLUMN ${col} ${def}`);
        console.log(`Added column ${col}`);
      }
    }
    console.log("Customer migration success");
  } catch (err) {
    console.error(err);
  } finally {
    connection.end();
  }
}
run();
