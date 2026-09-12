/**
 * Migration: Create users table
 * Admin/Staff login accounts linked to businesses.
 */
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).nullable(); // Nullable for Google OAuth users
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).nullable();
    table.string('phone', 20).nullable();
    table.enum('role', ['super_admin', 'admin', 'manager', 'staff', 'receptionist'])
      .notNullable().defaultTo('staff');
    table.string('avatar_url', 500).nullable();
    table.string('google_id', 255).nullable().unique();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.datetime('last_login_at').nullable();
    table.datetime('password_changed_at').nullable();
    table.string('password_reset_token', 255).nullable();
    table.datetime('password_reset_expires').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for frequently queried columns
    table.index('business_id');
    table.index('email');
    table.index('role');
    table.index('is_active');
    table.index('google_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
