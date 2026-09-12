/**
 * Migration: Create service_categories and salon_services tables
 */
export async function up(knex) {
  // Service Categories
  await knex.schema.createTable('service_categories', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.integer('sort_order').unsigned().notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('is_active');
  });

  // Salon Services
  await knex.schema.createTable('salon_services', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.integer('category_id').unsigned().nullable()
      .references('id').inTable('service_categories').onDelete('SET NULL');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.integer('duration_minutes').unsigned().notNullable().defaultTo(30);
    table.decimal('price', 10, 2).notNullable();
    table.decimal('cost_price', 10, 2).nullable();
    table.string('hsn_sac_code', 20).nullable();
    table.decimal('tax_percentage', 5, 2).notNullable().defaultTo(18.00);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.string('image_url', 500).nullable();
    table.enum('gender_target', ['male', 'female', 'unisex']).defaultTo('unisex');
    table.integer('sort_order').unsigned().notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('category_id');
    table.index('is_active');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('salon_services');
  await knex.schema.dropTableIfExists('service_categories');
}
