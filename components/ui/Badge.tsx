type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple' | 'secondary' | 'violet' | 'amber' | 'emerald';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  default: 'bg-[#1e2130] text-[#9ca3af] border-[#2a2f45]',
  purple: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  secondary: 'bg-[#1e2130] text-[#9ca3af] border-[#2a2f45]',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    // New Student Statuses
    'April Joinee': 'violet',
    'Not contacted': 'danger',
    "Contacted hasn't been confirmed for continuity": 'warning',
    'Contacted, has confirmed': 'success',
    'Discontinue/permanent Inactive': 'secondary',
    
    // Legacy/Generic Statuses
    active: 'success',
    inactive: 'danger',
    on_leave: 'warning',
    present: 'success',
    absent: 'danger',
    late: 'warning',
    completed: 'success',
    in_progress: 'info',
    pending: 'default',
  };
  return map[status] || 'default';
}
