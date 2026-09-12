/**
 * Migration: Create leads, campaigns, campaign_logs, expenses, expense_categories,
 * customer_feedback, and notification_templates tables
 */
export async function up(knex) {
  // Leads
  await knex.schema.createTable('leads', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.string('source', 100).nullable();
    table.json('interested_services').nullable();
    table.enum('status', ['new', 'contacted', 'follow_up', 'converted', 'lost'])
      .notNullable().defaultTo('new');
    table.integer('assigned_to').unsigned().nullable()
      .references('id').inTable('staff_members').onDelete('SET NULL');
    table.date('follow_up_date').nullable();
    table.text('notes').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('status');
    table.index('follow_up_date');
    table.index('assigned_to');
  });

  // Expense Categories
  await knex.schema.createTable('expense_categories', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
  });

  // Expenses
  await knex.schema.createTable('expenses', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.integer('category_id').unsigned().nullable()
      .references('id').inTable('expense_categories').onDelete('SET NULL');
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('tax_amount', 10, 2).notNullable().defaultTo(0.00);
    table.text('description').nullable();
    table.enum('payment_method', ['cash', 'card', 'upi', 'bank_transfer']).notNullable().defaultTo('cash');
    table.date('expense_date').notNullable();
    table.string('receipt_url', 500).nullable();
    table.integer('created_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('category_id');
    table.index('expense_date');
  });

  // Campaigns
  await knex.schema.createTable('campaigns', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.enum('type', ['sms', 'email', 'whatsapp']).notNullable();
    table.string('subject', 255).nullable();
    table.text('content').notNullable();
    table.string('template_id', 100).nullable();
    table.json('target_audience').nullable();
    table.integer('total_recipients').unsigned().notNullable().defaultTo(0);
    table.integer('sent_count').unsigned().notNullable().defaultTo(0);
    table.integer('failed_count').unsigned().notNullable().defaultTo(0);
    table.enum('status', ['draft', 'scheduled', 'sending', 'sent', 'failed'])
      .notNullable().defaultTo('draft');
    table.datetime('scheduled_at').nullable();
    table.datetime('sent_at').nullable();
    table.integer('created_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('type');
    table.index('status');
  });

  // Campaign Logs
  await knex.schema.createTable('campaign_logs', (table) => {
    table.increments('id').primary();
    table.integer('campaign_id').unsigned().notNullable()
      .references('id').inTable('campaigns').onDelete('CASCADE');
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.enum('channel', ['sms', 'email', 'whatsapp']).notNullable();
    table.enum('status', ['sent', 'delivered', 'failed', 'read']).notNullable().defaultTo('sent');
    table.text('error_message').nullable();
    table.timestamp('sent_at').notNullable().defaultTo(knex.fn.now());

    table.index('campaign_id');
    table.index('customer_id');
    table.index('status');
  });

  // Customer Feedback
  await knex.schema.createTable('customer_feedback', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.integer('invoice_id').unsigned().nullable()
      .references('id').inTable('invoices').onDelete('SET NULL');
    table.integer('appointment_id').unsigned().nullable()
      .references('id').inTable('appointments').onDelete('SET NULL');
    table.tinyint('rating').unsigned().notNullable(); // 1-5
    table.text('comment').nullable();
    table.integer('staff_member_id').unsigned().nullable()
      .references('id').inTable('staff_members').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('customer_id');
    table.index('rating');
    table.index('created_at');
  });

  // Notification Templates
  await knex.schema.createTable('notification_templates', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('event_type', 100).notNullable(); // e.g., 'appointment_booked'
    table.enum('channel', ['sms', 'email', 'whatsapp']).notNullable();
    table.string('subject', 255).nullable();
    table.text('body').notNullable(); // With {{placeholders}}
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('event_type');
    table.unique(['business_id', 'event_type', 'channel']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notification_templates');
  await knex.schema.dropTableIfExists('customer_feedback');
  await knex.schema.dropTableIfExists('campaign_logs');
  await knex.schema.dropTableIfExists('campaigns');
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('expense_categories');
  await knex.schema.dropTableIfExists('leads');
}
