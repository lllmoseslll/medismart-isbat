interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'teal';
  sub?: string;
  trend?: string;
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'ring-blue-100' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  ring: 'ring-green-100' },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  ring: 'ring-amber-100' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600',    ring: 'ring-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100' },
  teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600',   ring: 'ring-teal-100' },
};

export default function StatCard({ title, value, icon, color = 'teal', sub, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-11 w-11 flex items-center justify-center ring-1 ${c.bg} ${c.ring}`}>
          <span className={`${c.icon} [&>svg]:h-5 [&>svg]:w-5`}>{icon}</span>
        </div>
        {trend && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5">
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 leading-none mb-1.5" style={{ fontFamily: 'Outfit,sans-serif' }}>
        {value}
      </p>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
