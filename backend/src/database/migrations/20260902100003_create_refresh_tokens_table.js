/**
 * Migration: Create refresh_tokens table
 * Supports JWT refresh token rotation with reuse detection.
 */
export async function up(knex) {
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable(); // SHA-256 hash
    table.string('family_id', 36).notNullable(); // UUID to group related tokens
    table.boolean('is_revoked').notNullable().defaultTo(false);
    table.datetime('expires_at').notNullable();
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for fast lookup
    table.index('token_hash');
    table.index('family_id');
    table.index('user_id');
    table.index('is_revoked');
    table.index('expires_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('refresh_tokens');
}
