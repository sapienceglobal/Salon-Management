/**
 * Migration to enhance the leads table with additional fields for industry-grade CRM
 */
export async function up(knex) {
  // Alter status column to VARCHAR to allow all custom pipeline statuses
  await knex.schema.alterTable('leads', (table) => {
    table.string('status', 50).defaultTo('new').alter();
  });

  const hasEnquiryType = await knex.schema.hasColumn('leads', 'enquiry_type');
  if (!hasEnquiryType) {
    await knex.schema.alterTable('leads', (table) => {
      table.string('enquiry_type', 100).nullable();
    });
  }

  const hasPreferredBranch = await knex.schema.hasColumn('leads', 'preferred_branch');
  if (!hasPreferredBranch) {
    await knex.schema.alterTable('leads', (table) => {
      table.string('preferred_branch', 100).nullable();
    });
  }

  const hasPreferredStaff = await knex.schema.hasColumn('leads', 'preferred_staff_id');
  if (!hasPreferredStaff) {
    await knex.schema.alterTable('leads', (table) => {
      table.integer('preferred_staff_id').unsigned().nullable();
    });
  }

  const hasFollowUpTime = await knex.schema.hasColumn('leads', 'follow_up_time');
  if (!hasFollowUpTime) {
    await knex.schema.alterTable('leads', (table) => {
      table.string('follow_up_time', 20).nullable();
    });
  }

  const hasAvatarUrl = await knex.schema.hasColumn('leads', 'avatar_url');
  if (!hasAvatarUrl) {
    await knex.schema.alterTable('leads', (table) => {
      table.string('avatar_url', 500).nullable();
    });
  }

  const hasCustomerId = await knex.schema.hasColumn('leads', 'customer_id');
  if (!hasCustomerId) {
    await knex.schema.alterTable('leads', (table) => {
      table.integer('customer_id').unsigned().nullable();
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable('leads', (table) => {
    table.dropColumn('enquiry_type');
    table.dropColumn('preferred_branch');
    table.dropColumn('preferred_staff_id');
    table.dropColumn('follow_up_time');
    table.dropColumn('avatar_url');
    table.dropColumn('customer_id');
  });
}
