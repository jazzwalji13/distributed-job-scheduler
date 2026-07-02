import React from 'react';
import ResourcePage from './ResourcePage';

export default function WorkersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-white">Workers</h2>
        <p className="mt-1 text-sm text-slate-300">Worker processes, capacity, and heartbeat recency.</p>
      </div>

      <ResourcePage
        title="Workers"
        description=""
        endpoint="/workers"
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'host', label: 'Host' },
          { key: 'status', label: 'Status', render: (row) => (
            <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
              row.status === 'ONLINE' ? 'bg-emerald-500/15 text-emerald-300' :
              row.status === 'DRAINING' ? 'bg-amber-500/15 text-amber-300' :
              'bg-rose-500/15 text-rose-300'
            }`}>{row.status}</span>
          )},
          { key: 'capacity', label: 'Capacity' },
          { key: 'concurrencyRunning', label: 'Running', render: (row) => `${row.concurrencyRunning || 0}/${row.capacity}` },
          { key: 'lastSeenAt', label: 'Last Seen', render: (row) => new Date(row.lastSeenAt).toLocaleString() },
          { key: 'createdAt', label: 'Registered', render: (row) => new Date(row.createdAt).toLocaleString() }
        ]}
      />
    </div>
  );
}
