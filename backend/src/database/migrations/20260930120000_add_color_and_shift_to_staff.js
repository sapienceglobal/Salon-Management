/**
 * Migration: Add color_code and shift_schedule to staff_members table
 */
export async function up(knex) {
  const hasColor = await knex.schema.hasColumn('staff_members', 'color_code');
  const hasShift = await knex.schema.hasColumn('staff_members', 'shift_schedule');

  await knex.schema.alterTable('staff_members', (table) => {
    if (!hasColor) {
      table.string('color_code', 50).nullable().defaultTo('#E91E63');
    }
    if (!hasShift) {
      table.string('shift_schedule', 50).nullable().defaultTo('full_time');
    }
  });
}

export async function down(knex) {
  const hasColor = await knex.schema.hasColumn('staff_members', 'color_code');
  const hasShift = await knex.schema.hasColumn('staff_members', 'shift_schedule');

  await knex.schema.alterTable('staff_members', (table) => {
    if (hasColor) table.dropColumn('color_code');
    if (hasShift) table.dropColumn('shift_schedule');
  });
}
