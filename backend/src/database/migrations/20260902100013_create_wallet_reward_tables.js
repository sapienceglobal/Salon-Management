/**
 * Migration: Create wallet_transactions and reward_transactions tables
 */
export async function up(knex) {
  // Wallet Transactions
  await knex.schema.createTable('wallet_transactions', (table) => {
    table.increments('id').primary();
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.enum('type', ['credit', 'debit']).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('balance_after', 12, 2).notNullable();
    table.string('description', 255).nullable();
    table.enum('reference_type', ['topup', 'payment', 'refund', 'bonus']).nullable();
    table.integer('reference_id').unsigned().nullable();
    table.integer('created_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('customer_id');
    table.index('business_id');
    table.index('type');
    table.index('created_at');
  });

  // Reward Transactions
  await knex.schema.createTable('reward_transactions', (table) => {
    table.increments('id').primary();
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.enum('type', ['earned', 'redeemed', 'expired', 'bonus']).notNullable();
    table.integer('points').notNullable();
    table.integer('balance_after').notNullable();
    table.string('description', 255).nullable();
    table.string('reference_type', 50).nullable();
    table.integer('reference_id').unsigned().nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('customer_id');
    table.index('business_id');
    table.index('type');
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('reward_transactions');
  await knex.schema.dropTableIfExists('wallet_transactions');
}
