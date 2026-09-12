/**
 * Migration: Create audit_logs table
 * Complete audit trail for all write operations.
 */
export async function up(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.bigIncrements('id').primary();
    table.integer('business_id').unsigned().nullable()
      .references('id').inTable('businesses').onDelete('SET NULL');
    table.integer('user_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable(); // CREATE, UPDATE, DELETE, LOGIN, etc.
    table.string('entity_type', 100).notNullable(); // Table/module name
    table.integer('entity_id').nullable(); // Record ID
    table.json('old_values').nullable(); // Before change
    table.json('new_values').nullable(); // After change
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.text('description').nullable(); // Human-readable description
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for querying audit trail
    table.index('business_id');
    table.index('user_id');
    table.index('action');
    table.index('entity_type');
    table.index('entity_id');
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
}
