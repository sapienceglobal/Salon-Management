const fs = require('fs');
const content = fs.readFileSync('backend/src/modules/dashboard/dashboard.module.js', 'utf8');

const newGetRevenueChart = `  async getRevenueChart(businessId, startDate, endDate) {
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || \`\${today.substring(0, 7)}-01\`;
    const end = endDate || today;
    
    // Group by daily if range <= 31 days, otherwise monthly
    const startD = new Date(start);
    const endD = new Date(end);
    const diffDays = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24));
    
    let chartQuery = db('invoices')
      .where({ business_id: businessId })
      .whereNot('status', 'cancelled')
      .where('created_at', '>=', \`\${start} 00:00:00\`)
      .where('created_at', '<=', \`\${end} 23:59:59\`);
      
    let chartRows = [];
    if (diffDays <= 31) {
      chartRows = await chartQuery.clone()
        .select(db.raw('DATE(created_at) as label'), db.raw('COALESCE(SUM(total_amount), 0) as revenue'))
        .groupByRaw('DATE(created_at)').orderBy('label');
    } else {
      const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const rawRows = await chartQuery.clone()
        .select(db.raw('YEAR(created_at) as y'), db.raw('MONTH(created_at) as m'), db.raw('COALESCE(SUM(total_amount), 0) as revenue'))
        .groupByRaw('YEAR(created_at), MONTH(created_at)').orderBy('y').orderBy('m');
      
      chartRows = rawRows.map(r => ({
        label: \`\${MONTH_NAMES[parseInt(r.m) - 1]} \${r.y}\`,
        revenue: r.revenue
      }));
    }
    
    const chart = chartRows.map(r => ({ label: r.label, revenue: parseFloat(r.revenue) }));
    
    // Stats for the range
    const [stats] = await db('invoices')
      .where({ business_id: businessId })
      .whereNot('status', 'cancelled')
      .where('created_at', '>=', \`\${start} 00:00:00\`)
      .where('created_at', '<=', \`\${end} 23:59:59\`)
      .select(
        db.raw('COALESCE(SUM(total_amount), 0) as revenue'),
        db.raw('COALESCE(SUM(paid_amount), 0) as collected')
      );
      
    const [exp] = await db('expenses')
      .where({ business_id: businessId })
      .where('expense_date', '>=', start)
      .where('expense_date', '<=', end)
      .select(db.raw('COALESCE(SUM(amount), 0) as expenses'));
      
    const revenue = parseFloat(stats?.revenue || 0);
    const collected = parseFloat(stats?.collected || 0);
    const expenses = parseFloat(exp?.expenses || 0);
    const net_profit = collected - expenses;
    
    return { chart, stats: { revenue, collected, expenses, net_profit } };
  }`;

const replaced = content.replace(/  async getRevenueChart[\s\S]*?  async getTopServices/g, newGetRevenueChart + '\n\n  async getTopServices');
const routesReplaced = replaced.replace(/req.query.period, req.query.year/g, 'req.query.startDate, req.query.endDate');
fs.writeFileSync('backend/src/modules/dashboard/dashboard.module.js', routesReplaced);
console.log('done');
