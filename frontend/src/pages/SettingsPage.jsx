import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Panel, StatCard } from '../components/AppShell';

export default function SettingsPage() {
  const { user, currentOrganization } = useAuth();
  const organization = currentOrganization;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Review account, organization, and runtime configuration details for the scheduler control plane."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Account" value={user?.fullName || 'Unknown'} hint={user?.email || 'No email loaded'} tone="cyan" />
        <StatCard label="Role" value={user?.role || 'MEMBER'} hint="JWT protected access" tone="amber" />
        <StatCard label="Organization" value={organization?.name || 'None'} hint={organization?.slug || 'No slug available'} tone="emerald" />
        <StatCard label="Live Updates" value="Enabled" hint="Socket.IO subscribed" tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <div className="text-sm font-semibold text-white">Runtime details</div>
          <div className="mt-3 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>API base URL</span>
              <span className="text-slate-100">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>Socket endpoint</span>
              <span className="text-slate-100">{import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>Authentication</span>
              <span className="text-slate-100">JWT bearer</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Charting</span>
              <span className="text-slate-100">Chart.js</span>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="text-sm font-semibold text-white">Tenant overview</div>
          <div className="mt-3 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Organization</div>
              <div className="mt-1 text-lg font-semibold text-white">{organization?.name || 'No organization'}</div>
              <div className="mt-1 text-sm text-slate-300">{organization?.slug || 'Create an organization to begin scheduling jobs.'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">User</div>
              <div className="mt-1 text-lg font-semibold text-white">{user?.fullName || 'Unknown user'}</div>
              <div className="mt-1 text-sm text-slate-300">{user?.role || 'MEMBER'}</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
