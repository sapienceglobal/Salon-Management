/**
 * Migration: Add reference_no, include_in_tax, notes to expenses table
 */
export async function up(knex) {
  const hasRef = await knex.schema.hasColumn('expenses', 'reference_no');
  if (!hasRef) {
    await knex.schema.alterTable('expenses', (table) => {
      table.string('reference_no', 100).nullable().after('payment_method');
    });
  }

  const hasIncludeInTax = await knex.schema.hasColumn('expenses', 'include_in_tax');
  if (!hasIncludeInTax) {
    await knex.schema.alterTable('expenses', (table) => {
      table.boolean('include_in_tax').notNullable().defaultTo(true).after('tax_amount');
    });
  }

  const hasNotes = await knex.schema.hasColumn('expenses', 'notes');
  if (!hasNotes) {
    await knex.schema.alterTable('expenses', (table) => {
      table.text('notes').nullable().after('description');
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable('expenses', (table) => {
    table.dropColumn('reference_no');
    table.dropColumn('include_in_tax');
    table.dropColumn('notes');
  });
}
