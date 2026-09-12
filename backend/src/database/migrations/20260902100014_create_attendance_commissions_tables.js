/**
 * Migration: Create staff_attendance and staff_commissions tables
 */
export async function up(knex) {
  // Staff Attendance
  await knex.schema.createTable('staff_attendance', (table) => {
    table.increments('id').primary();
    table.integer('staff_member_id').unsigned().notNullable()
      .references('id').inTable('staff_members').onDelete('CASCADE');
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.date('date').notNullable();
    table.enum('status', ['present', 'absent', 'half_day', 'weekly_off', 'holiday', 'leave'])
      .notNullable().defaultTo('present');
    table.time('check_in_time').nullable();
    table.time('check_out_time').nullable();
    table.decimal('total_hours', 5, 2).nullable();
    table.decimal('overtime_hours', 5, 2).notNullable().defaultTo(0.00);
    table.text('notes').nullable();
    table.integer('marked_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['staff_member_id', 'date']); // One entry per staff per day
    table.index('business_id');
    table.index('date');
    table.index('status');
  });

  // Staff Commissions
  await knex.schema.createTable('staff_commissions', (table) => {
    table.increments('id').primary();
    table.integer('staff_member_id').unsigned().notNullable()
      .references('id').inTable('staff_members').onDelete('CASCADE');
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.integer('invoice_id').unsigned().notNullable()
      .references('id').inTable('invoices').onDelete('CASCADE');
    table.integer('invoice_item_id').unsigned().nullable()
      .references('id').inTable('invoice_items').onDelete('SET NULL');
    table.decimal('commission_amount', 10, 2).notNullable();
    table.enum('status', ['pending', 'paid']).notNullable().defaultTo('pending');
    table.datetime('paid_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('staff_member_id');
    table.index('business_id');
    table.index('status');
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('staff_commissions');
  await knex.schema.dropTableIfExists('staff_attendance');
}
