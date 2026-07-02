import React from 'react';

export function Panel({ children, className = '' }) {
  return <section className={`panel rounded-[28px] p-5 ${className}`.trim()}>{children}</section>;
}

export function StatCard({ label, value, hint, tone = 'cyan' }) {
  const toneStyles = {
    cyan: 'from-cyan-400/15 to-cyan-400/5 text-cyan-100',
    amber: 'from-ember-500/15 to-ember-500/5 text-amber-100',
    emerald: 'from-emerald-400/15 to-emerald-400/5 text-emerald-100',
    rose: 'from-rose-400/15 to-rose-400/5 text-rose-100'
  };

  return (
    <div className={`panel-strong rounded-[24px] bg-gradient-to-br p-5 ${toneStyles[tone] || toneStyles.cyan}`}>
      <div className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-300">{hint}</div>
    </div>
  );
}

export function Table({ columns, rows, emptyMessage = 'No data yet' }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.24em] text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-slate-950/30">
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-400" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id || index} className="transition hover:bg-white/5">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 text-sm text-slate-200">
                    {column.render ? column.render(row) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">{description}</p>
      </div>
      {action}
    </div>
  );
}
