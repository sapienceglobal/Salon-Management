/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Staff Services (Skills Assigned)
  await knex.schema.createTable('staff_services', (table) => {
    table.increments('id').primary();
    table.integer('staff_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('service_id').unsigned().references('id').inTable('salon_services').onDelete('CASCADE');
    table.boolean('is_assigned').defaultTo(true);
    table.integer('duration_mins').nullable(); // Optional override
    table.decimal('price', 10, 2).nullable(); // Optional override
    table.timestamps(true, true);
    
    table.unique(['staff_id', 'service_id']);
  });

  // Staff Schedules (Working Hours)
  await knex.schema.createTable('staff_schedules', (table) => {
    table.increments('id').primary();
    table.integer('staff_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('day_of_week').notNullable(); // 0 = Sunday, 1 = Monday, etc.
    table.boolean('is_working').defaultTo(true);
    table.time('start_time').nullable();
    table.time('end_time').nullable();
    table.time('break_start').nullable();
    table.time('break_end').nullable();
    table.timestamps(true, true);

    table.unique(['staff_id', 'day_of_week']);
  });

  // Staff Leaves & Special Availability
  await knex.schema.createTable('staff_leaves', (table) => {
    table.increments('id').primary();
    table.integer('staff_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.date('date').notNullable();
    table.string('leave_type').notNullable(); // 'full_day', 'half_day', 'special'
    table.string('status').defaultTo('pending'); // 'pending', 'approved', 'rejected'
    table.string('reason').nullable();
    table.time('start_time').nullable(); // Only if half_day or special
    table.time('end_time').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('staff_leaves');
  await knex.schema.dropTableIfExists('staff_schedules');
  await knex.schema.dropTableIfExists('staff_services');
};
