import React from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';
import api from '../api/client';

export default function QueuesPage() {
  const { user } = useAuth();
  const organizationId = user?.ownedOrganizations?.[0]?.id || user?.memberships?.[0]?.organizationId;

  if (!organizationId) {
    return (
      <Panel>
        <div className="text-sm text-slate-300">No organization selected. Register or join an organization to view queues.</div>
      </Panel>
    );
  }

  return (
    <ResourcePage
      title="Queues"
      description="Priority, concurrency, retry policy, pause state, and queue capacity at a glance."
      endpoint={`/queues?organizationId=${organizationId}`}
      actions={[
        {
          label: 'Pause',
          onClick: async (row) => {
            await api.post(`/queues/${row.id}/pause`, { reason: 'Paused from dashboard' });
          }
        },
        {
          label: 'Resume',
          onClick: async (row) => {
            await api.post(`/queues/${row.id}/resume`);
          }
        }
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'concurrencyLimit', label: 'Concurrency' },
        { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() }
      ]}
    />
  );
}
