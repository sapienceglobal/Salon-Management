/**
 * Migration: Create business_settings table
 * Global configuration for each salon business.
 */
export async function up(knex) {
  await knex.schema.createTable('business_settings', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable().unique()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.boolean('tax_enabled').notNullable().defaultTo(true);
    table.decimal('default_cgst', 5, 2).notNullable().defaultTo(9.00);
    table.decimal('default_sgst', 5, 2).notNullable().defaultTo(9.00);
    table.string('invoice_prefix', 20).notNullable().defaultTo('INV');
    table.integer('invoice_counter').unsigned().notNullable().defaultTo(1);
    table.integer('reward_points_per_100').unsigned().notNullable().defaultTo(10);
    table.decimal('reward_points_value', 5, 2).notNullable().defaultTo(1.00);
    table.integer('appointment_slot_duration').unsigned().notNullable().defaultTo(30);
    table.integer('booking_advance_days').unsigned().notNullable().defaultTo(30);
    table.text('cancellation_policy').nullable();
    table.integer('sms_balance').unsigned().notNullable().defaultTo(0);
    table.integer('whatsapp_balance').unsigned().notNullable().defaultTo(0);
    table.boolean('feedback_enabled').notNullable().defaultTo(true);
    table.boolean('auto_feedback_after_visit').notNullable().defaultTo(true);
    table.time('working_hours_start').notNullable().defaultTo('09:00:00');
    table.time('working_hours_end').notNullable().defaultTo('21:00:00');
    table.tinyint('weekly_off_day').unsigned().notNullable().defaultTo(1); // Monday
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('business_settings');
}
