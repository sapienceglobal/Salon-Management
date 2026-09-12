const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/admin/(panel)/dashboard/page.js', 'utf8');

content = content.replace(
  /const \[revenueLoading, setRevenueLoading\] = useState\(true\);/,
  `const [revenueLoading, setRevenueLoading] = useState(true);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');`
);

content = content.replace(
  /if \(revenueDateRange === 'today'\) \{/,
  `if (revenueDateRange === 'custom') {
        if (!customStartDate || !customEndDate) return; // Wait until both are selected
        start = new Date(customStartDate);
        end = new Date(customEndDate);
      } else if (revenueDateRange === 'today') {`
);

content = content.replace(
  /, \[revenueDateRange\]\);/,
  `, [revenueDateRange, customStartDate, customEndDate]);`
);

content = content.replace(
  /<option value="this_year">This Year<\/option>\s*<\/select>/,
  `<option value="this_year">This Year</option>
      <option value="custom">Custom Range</option>
    </select>
    {revenueDateRange === 'custom' && (
      <div className="flex items-center gap-2 mt-2 sm:mt-0">
        <input 
          type="date" 
          value={customStartDate} 
          onChange={(e) => setCustomStartDate(e.target.value)}
          className="text-sm bg-admin-surface border border-admin-border rounded-lg px-2 py-1 focus:outline-none focus:border-brand"
        />
        <span className="text-admin-text-muted">to</span>
        <input 
          type="date" 
          value={customEndDate} 
          onChange={(e) => setCustomEndDate(e.target.value)}
          className="text-sm bg-admin-surface border border-admin-border rounded-lg px-2 py-1 focus:outline-none focus:border-brand"
        />
      </div>
    )}`
);

content = content.replace(
  /<div className="flex items-center justify-between px-5 py-\[18px\] border-b border-admin-border">\s*<span className="text-\[0.95rem\] font-semibold">Revenue Overview<\/span>\s*<select/,
  `<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-[18px] border-b border-admin-border gap-3">
            <span className="text-[0.95rem] font-semibold">Revenue Overview</span>
            <div className="flex items-center gap-3">
              <select`
);

content = content.replace(
  /<\/select>\s*\{revenueDateRange === 'custom'[\s\S]*?<\/div>\s*\)\}/,
  (match) => match + '\n            </div>'
);

fs.writeFileSync('frontend/src/app/admin/(panel)/dashboard/page.js', content);
console.log('done');
