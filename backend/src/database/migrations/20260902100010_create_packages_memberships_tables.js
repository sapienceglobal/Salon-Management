/**
 * Migration: Create packages, memberships, prepaid_plans and related tables
 */
export async function up(knex) {
  // Packages
  await knex.schema.createTable('packages', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.integer('validity_days').unsigned().nullable();
    table.integer('max_uses').unsigned().nullable();
    table.decimal('tax_percentage', 5, 2).notNullable().defaultTo(18.00);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('is_active');
  });

  // Package Items (services inside a package)
  await knex.schema.createTable('package_items', (table) => {
    table.increments('id').primary();
    table.integer('package_id').unsigned().notNullable()
      .references('id').inTable('packages').onDelete('CASCADE');
    table.integer('service_id').unsigned().notNullable()
      .references('id').inTable('salon_services').onDelete('CASCADE');
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
  });

  // Memberships
  await knex.schema.createTable('memberships', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('duration_months').unsigned().notNullable();
    table.decimal('discount_percentage', 5, 2).notNullable().defaultTo(0.00);
    table.json('benefits').nullable();
    table.integer('max_members').unsigned().nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('is_active');
  });

  // Customer Memberships
  await knex.schema.createTable('customer_memberships', (table) => {
    table.increments('id').primary();
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.integer('membership_id').unsigned().notNullable()
      .references('id').inTable('memberships').onDelete('CASCADE');
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('status', ['active', 'expired', 'cancelled']).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('customer_id');
    table.index('status');
    table.index('end_date');
  });

  // Customer Packages
  await knex.schema.createTable('customer_packages', (table) => {
    table.increments('id').primary();
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.integer('package_id').unsigned().notNullable()
      .references('id').inTable('packages').onDelete('CASCADE');
    table.integer('remaining_uses').unsigned().notNullable();
    table.datetime('purchased_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('expires_at').nullable();
    table.enum('status', ['active', 'used', 'expired']).notNullable().defaultTo('active');

    table.index('customer_id');
    table.index('status');
  });

  // Prepaid Plans
  await knex.schema.createTable('prepaid_plans', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('bonus_amount', 12, 2).notNullable().defaultTo(0.00);
    table.integer('validity_days').unsigned().nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('is_active');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('prepaid_plans');
  await knex.schema.dropTableIfExists('customer_packages');
  await knex.schema.dropTableIfExists('customer_memberships');
  await knex.schema.dropTableIfExists('memberships');
  await knex.schema.dropTableIfExists('package_items');
  await knex.schema.dropTableIfExists('packages');
}
