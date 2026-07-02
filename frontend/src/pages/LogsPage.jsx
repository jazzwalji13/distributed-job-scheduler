import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';
import { SelectInput } from '../components/Forms';

export default function LogsPage() {
  const { currentOrganizationId: organizationId } = useAuth();
  const [level, setLevel] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!organizationId) {
    return <Panel><div className="text-sm text-slate-300">No organization selected.</div></Panel>;
  }

  const endpoint = `/logs?organizationId=${organizationId}${level ? `&level=${level}` : ''}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Logs</h2>
          <p className="mt-1 text-sm text-slate-300">Structured job log records for debugging and audit trails.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-300">Filter by level:</label>
          <select
            className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none"
            value={level}
            onChange={(e) => { setLevel(e.target.value); setRefreshKey((k) => k + 1); }}
          >
            <option value="">All Levels</option>
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      <ResourcePage
        key={refreshKey}
        title="Logs"
        description=""
        endpoint={endpoint}
        columns={[
          { key: 'level', label: 'Level', render: (row) => (
            <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
              row.level === 'ERROR' ? 'bg-rose-500/15 text-rose-300' :
              row.level === 'WARN' ? 'bg-amber-500/15 text-amber-300' :
              row.level === 'DEBUG' ? 'bg-slate-500/15 text-slate-300' :
              'bg-cyan-500/15 text-cyan-300'
            }`}>{row.level}</span>
          )},
          { key: 'message', label: 'Message' },
          { key: 'jobId', label: 'Job ID', render: (row) => <span className="font-mono text-xs">{(row.jobId || '').slice(0, 12)}...</span> },
          { key: 'createdAt', label: 'Timestamp', render: (row) => new Date(row.createdAt).toLocaleString() }
        ]}
      />
    </div>
  );
}
