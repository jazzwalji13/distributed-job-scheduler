import React from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';

export default function LogsPage() {
  const { user } = useAuth();
  const organizationId = user?.ownedOrganizations?.[0]?.id || user?.memberships?.[0]?.organizationId;

  if (!organizationId) {
    return (
      <Panel>
        <div className="text-sm text-slate-300">No organization selected. Register or join an organization to view logs.</div>
      </Panel>
    );
  }

  return (
    <ResourcePage
      title="Logs"
      description="Structured job log records for debugging and audit trails."
      endpoint={`/logs?organizationId=${organizationId}`}
      columns={[
        { key: 'jobId', label: 'Job ID' },
        { key: 'level', label: 'Level' },
        { key: 'message', label: 'Message' },
        { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() }
      ]}
    />
  );
}
