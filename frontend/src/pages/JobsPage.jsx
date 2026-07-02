import React from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';

export default function JobsPage() {
  const { currentOrganizationId: organizationId } = useAuth();

  if (!organizationId) {
    return (
      <Panel>
        <div className="text-sm text-slate-300">No organization selected. Register or join an organization to view jobs.</div>
      </Panel>
    );
  }

  return (
    <ResourcePage
      title="Jobs"
      description="Immediate, delayed, scheduled, recurring, and batch job activity."
      endpoint={`/jobs?organizationId=${organizationId}`}
      columns={[
        { key: 'id', label: 'Job ID' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'attempts', label: 'Attempts' },
        { key: 'runAt', label: 'Run At', render: (row) => new Date(row.runAt).toLocaleString() }
      ]}
    />
  );
}
