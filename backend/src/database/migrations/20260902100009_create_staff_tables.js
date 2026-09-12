/**
 * Migration: Create staff_members, staff_working_hours, commission_profiles, service_rooms tables
 */
export async function up(knex) {
  // Commission Profiles
  await knex.schema.createTable('commission_profiles', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.enum('type', ['flat', 'percentage', 'tiered']).notNullable().defaultTo('percentage');
    table.decimal('value', 10, 2).nullable();
    table.json('rules').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
  });

  // Staff Members (extended profile beyond user account)
  await knex.schema.createTable('staff_members', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().unique()
      .references('id').inTable('users').onDelete('CASCADE');
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('designation', 100).nullable();
    table.json('specializations').nullable();
    table.date('joining_date').nullable();
    table.decimal('salary', 12, 2).nullable();
    table.integer('commission_profile_id').unsigned().nullable()
      .references('id').inTable('commission_profiles').onDelete('SET NULL');
    table.boolean('is_available').notNullable().defaultTo(true);
    table.text('bio').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
    table.index('is_available');
  });

  // Staff Working Hours
  await knex.schema.createTable('staff_working_hours', (table) => {
    table.increments('id').primary();
    table.integer('staff_member_id').unsigned().notNullable()
      .references('id').inTable('staff_members').onDelete('CASCADE');
    table.tinyint('day_of_week').unsigned().notNullable(); // 0=Sunday, 6=Saturday
    table.time('start_time').nullable();
    table.time('end_time').nullable();
    table.boolean('is_working').notNullable().defaultTo(true);

    table.unique(['staff_member_id', 'day_of_week']);
  });

  // Service Rooms
  await knex.schema.createTable('service_rooms', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.integer('capacity').unsigned().notNullable().defaultTo(1);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('business_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('service_rooms');
  await knex.schema.dropTableIfExists('staff_working_hours');
  await knex.schema.dropTableIfExists('staff_members');
  await knex.schema.dropTableIfExists('commission_profiles');
}
