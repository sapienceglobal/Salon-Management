/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Fetch the first business dynamically instead of hardcoding 6
  const business = await knex('businesses').first();
  if (!business) {
    console.log('No business found. Please run initial seeds first.');
    return;
  }
  const businessId = business.id;

  console.log('Seeding inventory products...');
  
  const products = [
    {
      business_id: businessId,
      name: "L'Oréal Professionnel Serie Expert Absolut Repair Shampoo",
      category: "Hair Care",
      brand: "L'Oréal",
      sku: 'LO-ABS-300',
      barcode: '3474636974158',
      purchase_price: 650.00,
      selling_price: 950.00,
      stock_quantity: 24,
      min_stock_alert: 5,
      unit: 'ml',
      is_active: true
    },
    {
      business_id: businessId,
      name: "Kerastase Elixir Ultime L'Huile Original Hair Oil",
      category: "Hair Treatment",
      brand: "Kerastase",
      sku: 'KER-ELX-100',
      barcode: '3474636974159',
      purchase_price: 2100.00,
      selling_price: 3200.00,
      stock_quantity: 3,
      min_stock_alert: 5,
      unit: 'ml',
      is_active: true
    },
    {
      business_id: businessId,
      name: 'Schwarzkopf Professional Osis+ Session Extreme Hold Hairspray',
      category: 'Styling',
      brand: 'Schwarzkopf',
      sku: 'SCH-OSI-500',
      barcode: '3474636974160',
      purchase_price: 450.00,
      selling_price: 750.00,
      stock_quantity: 0,
      min_stock_alert: 10,
      unit: 'ml',
      is_active: true
    },
    {
      business_id: businessId,
      name: 'Moroccanoil Treatment Light',
      category: 'Hair Treatment',
      brand: 'Moroccanoil',
      sku: 'MOR-TRT-100',
      barcode: '3474636974161',
      purchase_price: 2400.00,
      selling_price: 3800.00,
      stock_quantity: 12,
      min_stock_alert: 8,
      unit: 'ml',
      is_active: true
    },
    {
      business_id: businessId,
      name: 'Olaplex No.4 Bond Maintenance Shampoo',
      category: 'Hair Care',
      brand: 'Olaplex',
      sku: 'OLA-N04-250',
      barcode: '3474636974162',
      purchase_price: 1800.00,
      selling_price: 2950.00,
      stock_quantity: 2,
      min_stock_alert: 6,
      unit: 'ml',
      is_active: true
    },
    {
      business_id: businessId,
      name: 'Wella Professionals Invigo Nutri-Enrich Deep Nourishing Mask',
      category: 'Hair Care',
      brand: 'Wella',
      sku: 'WEL-INV-500',
      barcode: '3474636974163',
      purchase_price: 550.00,
      selling_price: 850.00,
      stock_quantity: 18,
      min_stock_alert: 10,
      unit: 'gm',
      is_active: true
    }
  ];

  // Insert products
  await knex('products').insert(products);
  
  console.log('✅ Inventory products seeded successfully!');
}
