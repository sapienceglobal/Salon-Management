/**
 * Migration: Create customers table
 * Complete customer directory with wallet, rewards, and marketing preferences.
 */
export async function up(knex) {
  await knex.schema.createTable('customers', (table) => {
    table.increments('id').primary();
    table.integer('business_id').unsigned().notNullable()
      .references('id').inTable('businesses').onDelete('CASCADE');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).nullable();
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.enum('gender', ['male', 'female', 'other']).nullable();
    table.date('date_of_birth').nullable();
    table.date('anniversary').nullable();
    table.text('address').nullable();
    table.string('gst_number', 20).nullable();
    table.string('profile_image_url', 500).nullable();
    table.decimal('wallet_balance', 12, 2).notNullable().defaultTo(0.00);
    table.integer('reward_points').unsigned().notNullable().defaultTo(0);
    table.decimal('total_spent', 12, 2).notNullable().defaultTo(0.00);
    table.integer('total_visits').unsigned().notNullable().defaultTo(0);
    table.datetime('last_visit_at').nullable();
    table.boolean('sms_opt_in').notNullable().defaultTo(true);
    table.boolean('email_opt_in').notNullable().defaultTo(true);
    table.boolean('whatsapp_opt_in').notNullable().defaultTo(true);
    table.enum('source', ['walk_in', 'referral', 'online', 'campaign']).defaultTo('walk_in');
    table.text('notes').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('business_id');
    table.index('phone');
    table.index('email');
    table.index('is_active');
    table.index('last_visit_at');
    table.index('total_spent');
    // Composite unique: phone per business
    table.unique(['business_id', 'phone']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('customers');
}
