export const seed = async function(knex) {
  const targetBusiness = await knex('businesses').where('name', 'like', '%RAHairStylist%').orWhere('name', 'like', '%Kaira Makeover%').first();
  if (!targetBusiness) {
    console.log("RAHairStylist not found. Nothing to clear.");
    return;
  }
  const BUSINESS_ID = targetBusiness.id;
  console.log(`Clearing all data for RAHairStylist (ID: ${BUSINESS_ID})...`);

  // Delete all data linked to this business
  await knex('appointments').where({ business_id: BUSINESS_ID }).del();
  await knex('salon_services').where({ business_id: BUSINESS_ID }).del();
  await knex('packages').where({ business_id: BUSINESS_ID }).del();
  await knex('expenses').where({ business_id: BUSINESS_ID }).del();
  await knex('leads').where({ business_id: BUSINESS_ID }).del();
  await knex('staff_members').where({ business_id: BUSINESS_ID }).del();
  await knex('customers').where({ business_id: BUSINESS_ID }).del();
  
  // Users (staff) for this business
  await knex('users').where({ business_id: BUSINESS_ID }).whereNot('role', 'admin').del();

  console.log(`Successfully cleared old dummy data for RAHairStylist!`);
};
