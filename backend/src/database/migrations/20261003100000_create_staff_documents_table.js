/**
 * Migration: Create staff_documents table
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('staff_documents');
  if (!hasTable) {
    await knex.schema.createTable('staff_documents', (table) => {
      table.increments('id').primary();
      table.integer('staff_member_id').unsigned().notNullable()
        .references('id').inTable('staff_members').onDelete('CASCADE');
      table.integer('business_id').unsigned().notNullable()
        .references('id').inTable('businesses').onDelete('CASCADE');
      table.string('document_name', 255).notNullable();
      table.string('document_type', 100).notNullable().defaultTo('Identity Proof');
      table.string('file_url', 500).notNullable();
      table.string('file_size', 50).nullable();
      table.string('file_type', 100).nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

      table.index(['staff_member_id', 'business_id']);
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('staff_documents');
}
