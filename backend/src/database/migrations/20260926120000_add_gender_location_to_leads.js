/**
 * Migration: Add gender and location columns to leads table.
 */
export async function up(knex) {
  const hasGender = await knex.schema.hasColumn('leads', 'gender');
  if (!hasGender) {
    await knex.schema.alterTable('leads', (table) => {
      table.string('gender', 20).nullable();
    });
  }

  const hasLocation = await knex.schema.hasColumn('leads', 'location');
  if (!hasLocation) {
    await knex.schema.alterTable('leads', (table) => {
      table.string('location', 255).nullable();
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable('leads', (table) => {
    table.dropColumn('gender');
    table.dropColumn('location');
  });
}
