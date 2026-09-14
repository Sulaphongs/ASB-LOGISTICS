import React from 'react';

export default function StatCard({ label, value, tone = 'default', icon = null }) {
  const toneClass = {
    default: 'text-slate-800 dark:text-slate-100',
    danger: 'text-rose-600 dark:text-rose-400',
    success: 'text-emerald-600 dark:text-emerald-400',
  }[tone];
  const iconToneClass = {
    default: 'text-teal-500 dark:text-teal-400',
    danger: 'text-rose-500 dark:text-rose-400',
    success: 'text-emerald-500 dark:text-emerald-400',
  }[tone];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-extrabold ${toneClass}`}>{value}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
        </div>
        {icon && <div className={`${iconToneClass} opacity-80`}>{icon}</div>}
      </div>
    </div>
  );
}
