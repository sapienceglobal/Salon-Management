import knexConfig from '../knexfile.js';
import initKnex from 'knex';

const knex = initKnex(knexConfig.development);

async function run() {
  try {
    const [rows] = await knex.raw('SHOW TABLES');
    if (rows.length === 0) {
       console.log('No tables to drop.');
       process.exit();
    }
    const tableKey = Object.keys(rows[0])[0];
    
    await knex.raw('SET FOREIGN_KEY_CHECKS = 0;');
    for (const row of rows) {
      const tableName = row[tableKey];
      console.log(`Dropping table ${tableName}...`);
      await knex.raw(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    await knex.raw('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('All tables dropped successfully.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

run();
