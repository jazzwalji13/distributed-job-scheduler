import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';
import api from '../api/client';

export default function DeadLetterPage() {
  const { currentOrganizationId: organizationId } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRequeue = async (row) => {
    try {
      await api.post(`/dead-letter/${row.jobId || row.job?.id}/requeue`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this dead-letter job permanently?')) return;
    try {
      await api.delete(`/jobs/${row.jobId || row.job?.id}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message);
    }
  };

  const actions = [
    { label: 'Requeue', tone: 'danger', onClick: handleRequeue },
    { label: 'Delete', tone: 'danger', onClick: handleDelete },
  ];

  if (!organizationId) {
    return <Panel><div className="text-sm text-slate-300">No organization selected.</div></Panel>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-white">Dead Letter Queue</h2>
        <p className="mt-1 text-sm text-slate-300">Terminal failures that require operator attention or manual requeueing.</p>
      </div>

      <ResourcePage
        key={refreshKey}
        title="Dead Letter Queue"
        description=""
        endpoint={`/dead-letter?organizationId=${organizationId}`}
        actions={actions}
        columns={[
          { key: 'jobId', label: 'Job ID', render: (row) => <span className="font-mono text-xs">{(row.jobId || row.job?.id || '').slice(0, 12)}...</span> },
          { key: 'reason', label: 'Reason' },
          { key: 'failedAt', label: 'Failed At', render: (row) => new Date(row.failedAt).toLocaleString() },
          { key: 'job', label: 'Job Status', render: (row) => (
            <span className="rounded-lg bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-300">
              {row.job?.status || 'DEAD_LETTER'}
            </span>
          )},
          { key: 'job', label: 'Job Type', render: (row) => row.job?.type || '—' }
        ]}
      />
    </div>
  );
}
