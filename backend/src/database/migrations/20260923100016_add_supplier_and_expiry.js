/**
 * Migration: Create lookup tables for inventory and add fields to products.
 */
export async function up(knex) {
  await knex.schema.createTable('inventory_categories', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.unique(['business_id', 'name']);
  });

  await knex.schema.createTable('inventory_brands', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.unique(['business_id', 'name']);
  });

  await knex.schema.createTable('inventory_suppliers', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('contact_info', 255).nullable();
    table.unique(['business_id', 'name']);
  });

  await knex.schema.alterTable('products', (table) => {
    table.date('expiry_date').nullable();
    table.integer('supplier_id').unsigned().nullable()
      .references('id').inTable('inventory_suppliers').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('expiry_date');
    table.dropColumn('supplier_id');
  });
  await knex.schema.dropTableIfExists('inventory_suppliers');
  await knex.schema.dropTableIfExists('inventory_brands');
  await knex.schema.dropTableIfExists('inventory_categories');
}
