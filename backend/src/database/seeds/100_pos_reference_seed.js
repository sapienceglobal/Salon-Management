import { db } from '../../config/database.js';

export async function seedPosData() {
  const business = await db('businesses').first();
  if (!business) {
    console.log('No business found');
    return;
  }
  const businessId = business.id;
  console.log('Targeting business ID:', businessId);

  // 1. Ensure Categories
  const serviceCategories = [
    { name: 'Hair Care', description: 'Hair cut, styling, spa and treatments' },
    { name: 'Skin Care', description: 'Facials, cleanups and treatments' },
    { name: 'Makeup', description: 'Bridal and party makeup' },
    { name: 'Nail Care', description: 'Manicure, pedicure and nail art' },
    { name: 'Wellness', description: 'Massages and therapies' },
    { name: 'Grooming', description: 'Shaving and beard grooming' },
  ];

  for (const cat of serviceCategories) {
    const existing = await db('service_categories').where({ business_id: businessId, name: cat.name }).first();
    if (!existing) {
      await db('service_categories').insert({ ...cat, business_id: businessId });
    }
  }

  const allCats = await db('service_categories').where({ business_id: businessId });
  const catMap = {};
  allCats.forEach(c => { catMap[c.name] = c.id; });

  // 2. Services
  const servicesData = [
    { name: 'Women Haircut', cat: 'Hair Care', duration: 45, price: 500, gender: 'female', img: '/pos/svc_women_haircut.png' },
    { name: 'Men Haircut', cat: 'Hair Care', duration: 30, price: 250, gender: 'male', img: '/pos/svc_men_haircut.png' },
    { name: 'Hair Spa', cat: 'Hair Care', duration: 60, price: 1200, gender: 'unisex', img: '/pos/svc_hair_spa.png' },
    { name: 'Hair Colour', cat: 'Hair Care', duration: 90, price: 2000, gender: 'female', img: '/pos/svc_hair_colour.jpg' },
    { name: 'Fruit Facial', cat: 'Skin Care', duration: 60, price: 800, gender: 'female', img: '/pos/svc_facial.jpg' },
    { name: 'Bridal Makeup', cat: 'Makeup', duration: 120, price: 8000, gender: 'female', img: '/pos/svc_bridal_makeup.jpg' },
    { name: 'Party Makeup', cat: 'Makeup', duration: 60, price: 2500, gender: 'female', img: '/pos/svc_party_makeup.jpg' },
    { name: 'Classic Manicure', cat: 'Nail Care', duration: 45, price: 350, gender: 'female', img: '/pos/svc_manicure.jpg' },
    { name: 'Gel Nail Art', cat: 'Nail Care', duration: 60, price: 1500, gender: 'female', img: '/pos/svc_nail_art.jpg' },
    { name: 'Keratin Treatment', cat: 'Hair Care', duration: 90, price: 1200, gender: 'unisex', img: '/pos/svc_keratin.png' },
    { name: 'Head Massage', cat: 'Wellness', duration: 45, price: 600, gender: 'unisex', img: '/pos/svc_head_massage.jpg' },
    { name: 'Beard Styling', cat: 'Grooming', duration: 30, price: 300, gender: 'male', img: '/pos/svc_beard.jpg' },
  ];

  for (const s of servicesData) {
    const existing = await db('salon_services').where({ business_id: businessId, name: s.name }).first();
    if (existing) {
      await db('salon_services').where({ id: existing.id }).update({
        category_id: catMap[s.cat] || null,
        duration_minutes: s.duration,
        price: s.price,
        gender_target: s.gender,
        image_url: s.img,
        is_active: true
      });
    } else {
      await db('salon_services').insert({
        business_id: businessId,
        category_id: catMap[s.cat] || null,
        name: s.name,
        duration_minutes: s.duration,
        price: s.price,
        gender_target: s.gender,
        image_url: s.img,
        is_active: true
      });
    }
  }

  // 3. Products
  const productsData = [
    { name: "L'Oréal Shampoo", brand: "L'Oréal", category: 'Shampoo', unit: '250 ml', price: 650, img: '/pos/prod_shampoo.jpg' },
    { name: 'Wella Conditioner', brand: 'Wella', category: 'Conditioner', unit: '200 ml', price: 550, img: '/pos/prod_conditioner.jpg' },
    { name: 'Moroccanoil Hair Oil', brand: 'Moroccanoil', category: 'Hair Care', unit: '100 ml', price: 1850, img: '/pos/prod_hair_oil.jpg' },
    { name: 'Matrix Hair Serum', brand: 'Matrix', category: 'Hair Care', unit: '100 ml', price: 950, img: '/pos/prod_serum.jpg' },
    { name: 'Schwarzkopf Gel', brand: 'Schwarzkopf', category: 'Styling', unit: '150 ml', price: 450, img: '/pos/prod_gel.jpg' },
    { name: "L'Oréal Hair Mask", brand: "L'Oréal", category: 'Hair Care', unit: '250 ml', price: 1250, img: '/pos/prod_mask.jpg' },
    { name: 'Body Lotion', brand: 'Nivea', category: 'Skin Care', unit: '200 ml', price: 499, img: '/pos/prod_lotion.jpg' },
    { name: 'Face Cleanser', brand: 'Cetaphil', category: 'Skin Care', unit: '150 ml', price: 650, img: '/pos/prod_cleanser.jpg' },
    { name: 'Nail Polish', brand: 'OPI', category: 'Color', unit: '10 ml', price: 250, img: '/pos/prod_nailpolish.jpg' },
    { name: 'Hair Brush', brand: 'Denman', category: 'Tools & Accessories', unit: '1 pc', price: 350, img: '/pos/prod_brush.jpg' },
    { name: 'Hair Iron', brand: 'Philips', category: 'Tools & Accessories', unit: '1 pc', price: 2999, img: '/pos/prod_iron.jpg' },
    { name: 'Hair Dryer', brand: 'Dyson', category: 'Tools & Accessories', unit: '1 pc', price: 2499, img: '/pos/prod_dryer.jpg' }
  ];

  for (const p of productsData) {
    const existing = await db('products').where({ business_id: businessId, name: p.name }).first();
    if (existing) {
      await db('products').where({ id: existing.id }).update({
        brand: p.brand,
        category: p.category,
        unit: p.unit,
        selling_price: p.price,
        stock_quantity: 50,
        image_url: p.img,
        is_active: true
      });
    } else {
      await db('products').insert({
        business_id: businessId,
        name: p.name,
        brand: p.brand,
        category: p.category,
        unit: p.unit,
        selling_price: p.price,
        stock_quantity: 50,
        image_url: p.img,
        is_active: true
      });
    }
  }

  // 4. Packages
  const packagesData = [
    { name: 'Keratin Package', price: 3500, desc: 'Keratin Treatment, Hair Cut, Shampoo', validity_days: 90 },
    { name: 'Smoothening Package', price: 4500, desc: 'Hair Smoothening, Hair Cut, Deep Conditioning', validity_days: 90 },
    { name: 'Hair Colour Package', price: 3000, desc: 'Global Colour, Hair Spa, Hair Cut', validity_days: 60 },
    { name: 'Bridal Makeup Package', price: 15000, desc: 'HD/Airbrush Makeup, Hair Styling, Draping', validity_days: 30 },
    { name: 'Skin Glow Package', price: 4500, desc: 'Fruit Facial (3 Sessions), Face Cleanser, Skin Whitening Treatment', validity_days: 90 },
    { name: 'Nail Care Package', price: 2000, desc: 'Gel Nail Art, Manicure, Pedicure', validity_days: 60 },
    { name: 'Party Makeup Package', price: 5000, desc: 'Party Makeup, Hair Styling, Touch Up', validity_days: 30 },
    { name: 'Gents Grooming Package', price: 3000, desc: 'Hair Cut (6 Sessions), Beard Styling, Head Massage', validity_days: 180 },
    { name: 'Couple Spa Package', price: 6000, desc: 'Full Body Massage, Steam, Aromatherapy', validity_days: 60 },
  ];

  for (const pkg of packagesData) {
    const existing = await db('packages').where({ business_id: businessId, name: pkg.name }).first();
    if (existing) {
      await db('packages').where({ id: existing.id }).update({
        total_price: pkg.price,
        description: pkg.desc,
        validity_days: pkg.validity_days,
        is_active: true
      });
    } else {
      await db('packages').insert({
        business_id: businessId,
        name: pkg.name,
        total_price: pkg.price,
        description: pkg.desc,
        validity_days: pkg.validity_days,
        is_active: true
      });
    }
  }

  console.log('Seeding completed successfully!');
}

seedPosData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding POS data:', err);
    process.exit(1);
  });
