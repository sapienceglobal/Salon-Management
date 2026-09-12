require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./src/config/database.js').knexConfig;
const db = knex(knexConfig);

async function run() {
  const users = await db('users').select('email').limit(5);
  console.log("Users:", users);
  
  const customers = await db('customers').select('id', 'first_name', 'created_at').orderBy('created_at', 'desc').limit(5);
  console.log("Customers in DB:", customers);
  
  process.exit(0);
}
run();
