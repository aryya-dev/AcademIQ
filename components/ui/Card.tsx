import { ReactNode } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`bg-[#141722] border border-[#1e2130] rounded-xl p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'violet' | 'emerald' | 'amber' | 'red' | 'blue' | 'rose';
  trend?: string;
}

const colorMap: Record<string, string> = {
  violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
  emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
  red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
  blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
};

export function StatCard({ label, value, icon, color = 'violet', trend }: StatCardProps) {
  const c = colorMap[color] || colorMap.violet;
  return (
    <div className={`bg-gradient-to-br ${c} border rounded-xl p-5 flex items-start justify-between`}>
      <div>
        <p className="text-[#9ca3af] text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-white text-3xl font-bold mt-1">{value}</p>
        {trend && <p className="text-[#6b7280] text-xs mt-1">{trend}</p>}
      </div>
      <div className="mt-1 opacity-80">{icon}</div>
    </div>
  );
}
