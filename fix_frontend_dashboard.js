const fs = require('fs');
const content = fs.readFileSync('frontend/src/app/admin/(panel)/dashboard/page.js', 'utf8');

// 1. Add new state for date range and revenue data
let updated = content.replace(
  /const \[revenueChart, setRevenueChart\] = useState\(\[\]\);/,
  `const [revenueData, setRevenueData] = useState({ chart: [], stats: {} });
  const [revenueDateRange, setRevenueDateRange] = useState('this_month');
  const [revenueLoading, setRevenueLoading] = useState(true);`
);

// 2. Remove revenueChart from fetchDashboardData
updated = updated.replace(
  /api\.get\('\/dashboard\/revenue-chart'\),/,
  `// revenue chart fetched separately`
);
updated = updated.replace(
  /if \(revenueRes\.status === 'fulfilled'\) setRevenueChart\(revenueRes\.value\.data \|\| \[\]\);/,
  ``
);

// 3. Add fetchRevenueData and effect
const fetchRevenueBlock = `
  const fetchRevenueData = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const today = new Date();
      let start = new Date();
      let end = new Date();
      
      if (revenueDateRange === 'today') {
        // start and end are today
      } else if (revenueDateRange === 'yesterday') {
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
      } else if (revenueDateRange === 'this_week') {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start = new Date(today.setDate(diff));
        end = new Date(); // up to today
      } else if (revenueDateRange === 'last_month') {
        start.setMonth(today.getMonth() - 1, 1);
        end.setMonth(today.getMonth(), 0);
      } else if (revenueDateRange === 'this_month') {
        start.setDate(1);
      } else if (revenueDateRange === 'this_year') {
        start.setMonth(0, 1);
      }

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      const res = await api.get(\`/dashboard/revenue-chart?startDate=\${startDate}&endDate=\${endDate}\`);
      setRevenueData(res.data?.data || res.data || { chart: [], stats: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setRevenueLoading(false);
    }
  }, [revenueDateRange]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);
`;

updated = updated.replace(
  /useEffect\(\(\) => \{\s*fetchDashboardData\(\);\s*\}, \[fetchDashboardData\]\);/,
  `useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
${fetchRevenueBlock}`
);

// 4. Update the Revenue Overview UI to include the dropdown and use revenueData
updated = updated.replace(
  /<span className="text-sm text-admin-text-muted">Monthly<\/span>/,
  `<select 
      value={revenueDateRange}
      onChange={(e) => setRevenueDateRange(e.target.value)}
      className="text-sm bg-admin-surface border border-admin-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand cursor-pointer"
    >
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="this_week">This Week</option>
      <option value="this_month">This Month</option>
      <option value="last_month">Last Month</option>
      <option value="this_year">This Year</option>
    </select>`
);

updated = updated.replace(
  /loading \? \(/,
  `revenueLoading ? (`
);

updated = updated.replace(
  /<span className="font-heading text-2xl font-bold">{formatCurrency\(summary\?\.monthly\?\.revenue \?\? 0\)}<\/span>/,
  `<span className="font-heading text-2xl font-bold">{formatCurrency(revenueData?.stats?.revenue ?? 0)}</span>`
);

updated = updated.replace(
  /<span className="text-sm text-accent-green flex items-center gap-1">\s*<RiArrowUpLine \/> This Month\s*<\/span>/,
  `` // Remove "This Month" static label since the dropdown handles it
);

updated = updated.replace(
  /\{revenueChart\.length > 0 \? \(/,
  `{revenueData?.chart?.length > 0 ? (`
);

updated = updated.replace(
  /<AreaChart data=\{revenueChart\}/,
  `<AreaChart data={revenueData.chart}`
);

updated = updated.replace(
  /\{ color: 'bg-accent-green', label: 'Collected', pct: formatCurrency\(summary\?\.monthly\?\.collected \?\? 0\) \},/,
  `{ color: 'bg-accent-green', label: 'Collected', pct: formatCurrency(revenueData?.stats?.collected ?? 0) },`
);
updated = updated.replace(
  /\{ color: 'bg-accent-red', label: 'Expenses', pct: formatCurrency\(summary\?\.monthly\?\.expenses \?\? 0\) \},/,
  `{ color: 'bg-accent-red', label: 'Expenses', pct: formatCurrency(revenueData?.stats?.expenses ?? 0) },`
);
updated = updated.replace(
  /\{ color: 'bg-accent-purple', label: 'Net Profit', pct: formatCurrency\(summary\?\.monthly\?\.net_profit \?\? 0\) \},/,
  `{ color: 'bg-accent-purple', label: 'Net Profit', pct: formatCurrency(revenueData?.stats?.net_profit ?? 0) },`
);

fs.writeFileSync('frontend/src/app/admin/(panel)/dashboard/page.js', updated);
console.log('done');
