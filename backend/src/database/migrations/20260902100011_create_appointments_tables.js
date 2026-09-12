/**
 * Migration: Create appointments and appointment_services tables
 */
export async function up(knex) {
  // Appointments
  await knex.schema.createTable('appointments', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.integer('customer_id').unsigned().notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    table.integer('staff_member_id').unsigned().nullable()
      .references('id').inTable('staff_members').onDelete('SET NULL');
    table.date('appointment_date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.enum('status', ['planned', 'ongoing', 'completed', 'cancelled', 'no_show'])
      .notNullable().defaultTo('planned');
    table.text('notes').nullable();
    table.enum('source', ['walk_in', 'phone', 'online', 'app']).defaultTo('walk_in');
    table.integer('invoice_id').unsigned().nullable(); // Set after billing
    table.integer('created_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for calendar queries
    table.index('business_id');
    table.index('customer_id');
    table.index('staff_member_id');
    table.index('appointment_date');
    table.index('status');
    table.index(['business_id', 'appointment_date']); // Composite for day view
    table.index(['staff_member_id', 'appointment_date']); // Staff calendar
  });

  // Appointment Services (junction table — multiple services per appointment)
  await knex.schema.createTable('appointment_services', (table) => {
    table.increments('id').primary();
    table.integer('appointment_id').unsigned().notNullable()
      .references('id').inTable('appointments').onDelete('CASCADE');
    table.integer('service_id').unsigned().notNullable()
      .references('id').inTable('salon_services').onDelete('CASCADE');
    table.integer('staff_member_id').unsigned().nullable()
      .references('id').inTable('staff_members').onDelete('SET NULL');
    table.decimal('price', 10, 2).notNullable(); // Snapshot at booking time
    table.integer('duration_minutes').unsigned().notNullable();
    table.string('room_number', 20).nullable();
    table.datetime('start_time').nullable(); // Actual start
    table.datetime('end_time').nullable(); // Actual end
    table.enum('status', ['pending', 'in_progress', 'completed']).notNullable().defaultTo('pending');

    table.index('appointment_id');
    table.index('service_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('appointment_services');
  await knex.schema.dropTableIfExists('appointments');
}
