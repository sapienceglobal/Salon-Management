/**
 * Migration: Add next_follow_up to leads table
 */
export async function up(knex) {
  const hasCol = await knex.schema.hasColumn('leads', 'next_follow_up');
  if (!hasCol) {
    await knex.schema.alterTable('leads', (table) => {
      table.string('next_follow_up', 100).nullable().after('follow_up_time');
    });
  }
}

export async function down(knex) {
  const hasCol = await knex.schema.hasColumn('leads', 'next_follow_up');
  if (hasCol) {
    await knex.schema.alterTable('leads', (table) => {
      table.dropColumn('next_follow_up');
    });
  }
}
