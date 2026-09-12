/**
 * Migration: Create businesses table
 * The root entity for multi-tenant support.
 */
export async function up(knex) {
  await knex.schema.createTable('businesses', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.string('logo_url', 500).nullable();
    table.text('address').nullable();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.string('pincode', 10).nullable();
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.string('gst_number', 20).nullable();
    table.string('currency', 10).notNullable().defaultTo('INR');
    table.string('timezone', 50).notNullable().defaultTo('Asia/Kolkata');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('slug');
    table.index('is_active');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('businesses');
}
