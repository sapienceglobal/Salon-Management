/**
 * Migration: Create invoices, invoice_items, and payments tables
 */
export async function up(knex) {
  // Invoices
  await knex.schema.createTable('invoices', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('invoice_number', 50).notNullable().unique();
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.integer('appointment_id').unsigned().nullable()
      .references('id').inTable('appointments').onDelete('SET NULL');
    table.decimal('subtotal', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0.00);
    table.enum('discount_type', ['flat', 'percentage']).nullable();
    table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('cgst_amount', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('sgst_amount', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('paid_amount', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('due_amount', 12, 2).notNullable().defaultTo(0.00);
    table.decimal('tip_amount', 12, 2).notNullable().defaultTo(0.00);
    table.enum('status', ['draft', 'paid', 'partial', 'unpaid', 'refunded', 'cancelled'])
      .notNullable().defaultTo('draft');
    table.enum('payment_status', ['pending', 'completed', 'partial', 'refunded'])
      .notNullable().defaultTo('pending');
    table.text('notes').nullable();
    table.integer('created_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('customer_id');
    table.index('appointment_id');
    table.index('status');
    table.index('payment_status');
    table.index('created_at');
    table.index(['business_id', 'created_at']); // For reporting
  });

  // Invoice Items
  await knex.schema.createTable('invoice_items', (table) => {
    table.increments('id').primary();
    table.integer('invoice_id').unsigned().notNullable()
      .references('id').inTable('invoices').onDelete('CASCADE');
    table.enum('item_type', ['service', 'product', 'package', 'membership', 'prepaid']).notNullable();
    table.integer('item_id').unsigned().notNullable(); // Reference to service/product/package/membership
    table.string('item_name', 255).notNullable(); // Snapshot
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('discount', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('tax_percentage', 5, 2).notNullable().defaultTo(0.00);
    table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('total_price', 10, 2).notNullable();
    table.integer('staff_member_id').unsigned().nullable()
      .references('id').inTable('staff_members').onDelete('SET NULL');

    table.index('invoice_id');
    table.index('item_type');
  });

  // Payments
  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.integer('invoice_id').unsigned().notNullable()
      .references('id').inTable('invoices').onDelete('CASCADE');
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.decimal('amount', 12, 2).notNullable();
    table.enum('payment_method', ['cash', 'card', 'upi', 'wallet', 'split']).notNullable();
    table.string('transaction_id', 100).nullable();
    table.enum('status', ['success', 'failed', 'pending', 'refunded']).notNullable().defaultTo('success');
    table.decimal('refund_amount', 12, 2).notNullable().defaultTo(0.00);
    table.text('refund_reason').nullable();
    table.integer('processed_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('invoice_id');
    table.index('customer_id');
    table.index('status');
    table.index('payment_method');
    table.index('created_at');
  });

  // Add foreign key for invoice_id in appointments (circular reference resolved)
  await knex.schema.alterTable('appointments', (table) => {
    table.foreign('invoice_id').references('id').inTable('invoices').onDelete('SET NULL');
  });
}

export async function down(knex) {
  // Remove foreign key from appointments first
  await knex.schema.alterTable('appointments', (table) => {
    table.dropForeign('invoice_id');
  });

  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('invoice_items');
  await knex.schema.dropTableIfExists('invoices');
}
