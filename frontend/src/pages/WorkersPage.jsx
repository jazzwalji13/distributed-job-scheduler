import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';
import { Modal, FormField, TextInput, SubmitButton, useToast } from '../components/Forms';
import api from '../api/client';

export default function WorkersPage() {
  const { currentOrganizationId: organizationId } = useAuth();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [form, setForm] = useState({ name: '', host: '', capacity: '5', version: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetForm = () => { setForm({ name: '', host: '', capacity: '5', version: '' }); setError(null); };

  const openCreate = () => { resetForm(); setShowCreate(true); };

  const openEdit = (worker) => {
    setForm({
      name: worker.name || '',
      host: worker.host || '',
      capacity: String(worker.capacity || 5),
      version: worker.version || ''
    });
    setEditingWorker(worker);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingWorker) {
        await api.put(`/workers/${editingWorker.id}`, {
          name: form.name, host: form.host,
          capacity: parseInt(form.capacity, 10) || 5,
          version: form.version || undefined
        });
        toast.success('Worker updated');
      } else {
        await api.post('/workers/register', {
          name: form.name, host: form.host,
          pid: 0,
          capacity: parseInt(form.capacity, 10) || 5,
          version: form.version || undefined
        });
        toast.success('Worker registered');
      }
      setShowCreate(false);
      setEditingWorker(null);
      resetForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (worker) => {
    if (!window.confirm(`Delete worker "${worker.name}"?`)) return;
    try {
      await api.delete(`/workers/${worker.id}`);
      toast.success('Worker deleted');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message);
    }
  };

  const handleStatusToggle = async (worker) => {
    const newStatus = worker.status === 'ONLINE' ? 'DRAINING' : 'ONLINE';
    try {
      await api.patch(`/workers/${worker.id}/status`, { status: newStatus });
      toast.success(`Worker set to ${newStatus}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message);
    }
  };

  const actions = [
    { label: (row) => row.status === 'ONLINE' ? 'Drain' : 'Activate', onClick: handleStatusToggle },
    { label: 'Edit', onClick: openEdit },
    { label: 'Delete', tone: 'danger', onClick: handleDelete }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Workers</h2>
          <p className="mt-1 text-sm text-slate-300">Worker processes, capacity, and heartbeat recency.</p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          + Register Worker
        </button>
      </div>

      <ResourcePage
        key={refreshKey}
        title="Workers"
        description=""
        endpoint="/workers"
        actions={actions}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'host', label: 'Host' },
          { key: 'status', label: 'Status', render: (row) => (
            <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
              row.status === 'ONLINE' ? 'bg-emerald-500/15 text-emerald-300' :
              row.status === 'DRAINING' ? 'bg-amber-500/15 text-amber-300' :
              'bg-rose-500/15 text-rose-300'
            }`}>{row.status}</span>
          )},
          { key: 'capacity', label: 'Capacity' },
          { key: 'concurrencyRunning', label: 'Running', render: (row) => `${row.concurrencyRunning || 0}/${row.capacity}` },
          { key: 'lastSeenAt', label: 'Last Seen', render: (row) => new Date(row.lastSeenAt).toLocaleString() },
          { key: 'createdAt', label: 'Registered', render: (row) => new Date(row.createdAt).toLocaleString() }
        ]}
      />

      <Modal open={showCreate || !!editingWorker} onClose={() => { setShowCreate(false); setEditingWorker(null); }} title={editingWorker ? 'Edit Worker' : 'Register Worker'}>
        {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="worker-1" required />
          </FormField>
          <FormField label="Host" required>
            <TextInput value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="localhost" required />
          </FormField>
          <FormField label="Capacity">
            <TextInput value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} type="number" />
          </FormField>
          <FormField label="Version">
            <TextInput value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0.0" />
          </FormField>
          <SubmitButton loading={loading}>{editingWorker ? 'Save Changes' : 'Register Worker'}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
