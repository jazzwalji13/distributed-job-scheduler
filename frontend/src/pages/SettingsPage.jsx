import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Panel, StatCard } from '../components/AppShell';
import { Modal, FormField, TextInput, SubmitButton } from '../components/Forms';
import api from '../api/client';

export default function SettingsPage() {
  const { user, currentOrganization } = useAuth();
  const organization = currentOrganization;
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    api.get('/auth/me').then(() => setApiStatus('connected')).catch(() => setApiStatus('disconnected'));
  }, []);

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    if (!organization) return;
    setLoading(true);
    setError(null);
    try {
      await api.put(`/organizations/${organization.id}`, { name: orgForm.name, slug: orgForm.slug || undefined });
      setShowEditOrg(false);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Settings</h2>
          <p className="mt-1 text-sm text-slate-300">Review account, organization, and runtime configuration details.</p>
        </div>
        {organization && (
          <button onClick={() => { setOrgForm({ name: organization.name, slug: organization.slug }); setShowEditOrg(true); }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
            Edit Organization
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Account" value={user?.fullName || 'Unknown'} hint={user?.email || 'No email loaded'} tone="cyan" />
        <StatCard label="Role" value={user?.role || 'MEMBER'} hint="JWT protected access" tone="amber" />
        <StatCard label="Organization" value={organization?.name || 'None'} hint={organization?.slug || 'No slug available'} tone="emerald" />
        <StatCard label="API Status" value={apiStatus === 'connected' ? 'Connected' : 'Disconnected'} hint={`Backend: ${import.meta.env.VITE_API_BASE_URL || 'localhost:3000'}`} tone={apiStatus === 'connected' ? 'emerald' : 'rose'} />
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
              <span>Environment</span>
              <span className="text-slate-100">{import.meta.env.MODE || 'development'}</span>
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

      <Modal open={showEditOrg} onClose={() => setShowEditOrg(false)} title="Edit Organization">
        {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}
        <form onSubmit={handleUpdateOrg} className="space-y-4">
          <FormField label="Organization Name" required>
            <TextInput value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} required />
          </FormField>
          <FormField label="Slug">
            <TextInput value={orgForm.slug} onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })} />
          </FormField>
          <SubmitButton loading={loading}>Save Changes</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
