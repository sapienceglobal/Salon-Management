/**
 * Migration: Add image_url to packages and memberships tables
 */
export async function up(knex) {
  const hasPkgImage = await knex.schema.hasColumn('packages', 'image_url');
  if (!hasPkgImage) {
    await knex.schema.table('packages', (table) => {
      table.string('image_url', 500).nullable().after('description');
    });
  }

  const hasMemImage = await knex.schema.hasColumn('memberships', 'image_url');
  if (!hasMemImage) {
    await knex.schema.table('memberships', (table) => {
      table.string('image_url', 500).nullable().after('description');
    });
  }
}

export async function down(knex) {
  const hasPkgImage = await knex.schema.hasColumn('packages', 'image_url');
  if (hasPkgImage) {
    await knex.schema.table('packages', (table) => {
      table.dropColumn('image_url');
    });
  }

  const hasMemImage = await knex.schema.hasColumn('memberships', 'image_url');
  if (hasMemImage) {
    await knex.schema.table('memberships', (table) => {
      table.dropColumn('image_url');
    });
  }
}
