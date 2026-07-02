import React from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';

export default function ProjectsPage() {
  const { user } = useAuth();
  const organizationId = user?.ownedOrganizations?.[0]?.id || user?.memberships?.[0]?.organizationId;

  if (!organizationId) {
    return (
      <Panel>
        <div className="text-sm text-slate-300">No organization selected. Register or join an organization to view projects.</div>
      </Panel>
    );
  }

  return (
    <ResourcePage
      title="Projects"
      description="Organized workspaces that group queues and jobs by product or team."
      endpoint={`/projects?organizationId=${organizationId}`}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'key', label: 'Key' },
        { key: 'description', label: 'Description' },
        { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() }
      ]}
    />
  );
}
