/**
 * Migration: Add icon column to service_categories table
 */
export async function up(knex) {
  const hasIcon = await knex.schema.hasColumn('service_categories', 'icon');
  if (!hasIcon) {
    await knex.schema.alterTable('service_categories', (table) => {
      table.string('icon', 100).nullable().defaultTo('scissors');
    });
  }
}

export async function down(knex) {
  const hasIcon = await knex.schema.hasColumn('service_categories', 'icon');
  if (hasIcon) {
    await knex.schema.alterTable('service_categories', (table) => {
      table.dropColumn('icon');
    });
  }
}
