import { db } from '../config/database.js';

async function renameSalon() {
  try {
    console.log('🔄 Updating salon business name and admin email to RAHairStylist...');

    const business = await db('businesses').orderBy('id', 'asc').first();
    if (business) {
      await db('businesses')
        .where({ id: business.id })
        .update({
          name: 'RAHairStylist',
          slug: 'rahairstylist',
          email: 'admin@rahairstylist.salontime.co.in',
          updated_at: db.fn.now(),
        });
      console.log(`✅ Updated business ID ${business.id} -> RAHairStylist (admin@rahairstylist.salontime.co.in)`);
    }

    const updatedUsers = await db('users')
      .where('email', 'like', '%kaira%')
      .update({
        email: 'admin@rahairstylist.salontime.co.in',
        updated_at: db.fn.now(),
      });
    console.log(`✅ Updated ${updatedUsers} user account(s) with kaira email -> admin@rahairstylist.salontime.co.in`);

    const updatedStaff = await db('staff_members')
      .where('email', 'like', '%kaira%')
      .update({
        email: 'admin@rahairstylist.salontime.co.in',
        updated_at: db.fn.now(),
      });
    console.log(`✅ Updated ${updatedStaff} staff record(s) with kaira email -> admin@rahairstylist.salontime.co.in`);
  } catch (err) {
    console.error('❌ Error updating database:', err.message);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

renameSalon();
