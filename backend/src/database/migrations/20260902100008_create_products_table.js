/**
 * Migration: Create products table for inventory management.
 */
export async function up(knex) {
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('sku', 100).nullable();
    table.string('barcode', 100).nullable();
    table.string('brand', 100).nullable();
    table.string('category', 100).nullable();
    table.decimal('purchase_price', 10, 2).nullable();
    table.decimal('selling_price', 10, 2).notNullable();
    table.integer('stock_quantity').notNullable().defaultTo(0);
    table.integer('min_stock_alert').unsigned().notNullable().defaultTo(5);
    table.string('hsn_sac_code', 20).nullable();
    table.decimal('tax_percentage', 5, 2).notNullable().defaultTo(18.00);
    table.string('unit', 20).notNullable().defaultTo('piece');
    table.string('image_url', 500).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('is_active');
    table.index('stock_quantity');
    table.unique(['business_id', 'sku']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('products');
}
