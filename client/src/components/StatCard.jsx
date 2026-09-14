import React from 'react';

export default function StatCard({ label, value, tone = 'default', icon = null }) {
  const toneClass = {
    default: 'text-slate-800',
    danger: 'text-rose-600',
    success: 'text-emerald-600',
  }[tone];
  const iconToneClass = {
    default: 'text-teal-500',
    danger: 'text-rose-500',
    success: 'text-emerald-500',
  }[tone];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-extrabold ${toneClass}`}>{value}</div>
          <div className="text-xs text-slate-500 mt-1">{label}</div>
        </div>
        {icon && <div className={`${iconToneClass} opacity-80`}>{icon}</div>}
      </div>
    </div>
  );
}
