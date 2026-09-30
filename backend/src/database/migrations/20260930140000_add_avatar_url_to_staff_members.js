/**
 * Migration: Add avatar_url to staff_members table
 */
export async function up(knex) {
  const hasCol = await knex.schema.hasColumn('staff_members', 'avatar_url');
  if (!hasCol) {
    await knex.schema.alterTable('staff_members', (table) => {
      table.string('avatar_url', 500).nullable().after('bio');
    });
  }
}

export async function down(knex) {
  const hasCol = await knex.schema.hasColumn('staff_members', 'avatar_url');
  if (hasCol) {
    await knex.schema.alterTable('staff_members', (table) => {
      table.dropColumn('avatar_url');
    });
  }
}
