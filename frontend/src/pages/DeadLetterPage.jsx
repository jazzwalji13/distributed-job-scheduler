import React from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';
import api from '../api/client';

export default function DeadLetterPage() {
  const { user } = useAuth();
  const organizationId = user?.ownedOrganizations?.[0]?.id || user?.memberships?.[0]?.organizationId;

  if (!organizationId) {
    return (
      <Panel>
        <div className="text-sm text-slate-300">No organization selected. Register or join an organization to view dead-letter jobs.</div>
      </Panel>
    );
  }

  return (
    <ResourcePage
      title="Dead Letter Queue"
      description="Terminal failures that require operator attention or manual requeueing."
      endpoint={`/dead-letter?organizationId=${organizationId}`}
      actions={[
        {
          label: 'Requeue',
          tone: 'danger',
          onClick: async (row) => {
            await api.post(`/dead-letter/${row.jobId}/requeue`);
          }
        }
      ]}
      columns={[
        { key: 'jobId', label: 'Job ID', render: (row) => row.job?.id || row.jobId },
        { key: 'reason', label: 'Reason' },
        { key: 'failedAt', label: 'Failed At', render: (row) => new Date(row.failedAt).toLocaleString() },
        { key: 'status', label: 'Job Status', render: (row) => row.job?.status || 'DEAD_LETTER' }
      ]}
    />
  );
}
