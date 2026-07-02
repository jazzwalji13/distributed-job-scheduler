import React from 'react';
import ResourcePage from './ResourcePage';

export default function WorkersPage() {
  return (
    <ResourcePage
      title="Workers"
      description="Worker processes, capacity, and heartbeat recency."
      endpoint="/workers"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'host', label: 'Host' },
        { key: 'status', label: 'Status' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'lastSeenAt', label: 'Last Seen', render: (row) => new Date(row.lastSeenAt).toLocaleString() },
        { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() }
      ]}
    />
  );
}
