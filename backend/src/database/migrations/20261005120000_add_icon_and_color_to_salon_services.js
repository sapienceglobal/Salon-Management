/**
 * Migration: Add icon and service_color to salon_services
 */
export async function up(knex) {
  const hasIcon = await knex.schema.hasColumn('salon_services', 'icon');
  if (!hasIcon) {
    await knex.schema.table('salon_services', (table) => {
      table.string('icon', 100).nullable();
      table.string('service_color', 50).nullable().defaultTo('#EC4899');
    });
  }
}

export async function down(knex) {
  const hasIcon = await knex.schema.hasColumn('salon_services', 'icon');
  if (hasIcon) {
    await knex.schema.table('salon_services', (table) => {
      table.dropColumn('icon');
      table.dropColumn('service_color');
    });
  }
}
